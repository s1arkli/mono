/** 负责封装语音房间连接、成员同步、麦克风和降噪切换逻辑。 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter'
import type { ToastState } from '@/components/Toast'
import { appEnv } from '@/config/env'
import { postJson } from '@/lib/http/client'
import { appLogger } from '@/lib/logger'
import type { VoiceJoinPayload, VoiceParticipantSummary, VoiceRoomSnapshot } from '@/types/voice'
import {
  ConnectionState,
  ParticipantEvent,
  Room,
  RoomEvent,
  Track,
  type AudioCaptureOptions,
  type Participant,
  type RemoteAudioTrack,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  isAudioTrack,
} from 'livekit-client'

const VOICE_BASE_CANDIDATES = ['/api/v1/voice', '/voice']
const AUDIO_HOST_DATASET_KEY = 'voiceAudioHost'
const GET_USER_MEDIA_UNSUPPORTED_MESSAGE = '当前浏览器不支持麦克风采集，请更换到较新的桌面浏览器后再试。'
const LIVEKIT_URL_MISSING_MESSAGE = '当前环境未配置 VITE_LIVEKIT_URL，暂时无法连接语音服务。'

type KrispModule = typeof import('@livekit/krisp-noise-filter')

interface UseVoiceRoomOptions {
  identity: string
  onToast?: (toast: ToastState) => void
}

type LiveKitAudioProcessor = NonNullable<AudioCaptureOptions['processor']>

function resolveParticipantKey(participant: Participant) {
  return `${participant.isLocal ? 'local' : 'remote'}:${participant.identity}`
}

function resolveTrackKey(track: RemoteAudioTrack) {
  return track.sid ?? track.mediaStreamTrack.id
}

function toLiveKitAudioProcessor(processor: KrispNoiseFilterProcessor): LiveKitAudioProcessor {
  // 第三方库的类型声明与当前项目的 exactOptionalPropertyTypes（精确可选属性类型）有冲突，这里做一次显式收窄。
  return processor as unknown as LiveKitAudioProcessor
}

function mapParticipantSummary(participant: Participant): VoiceParticipantSummary {
  const microphonePublication = participant.getTrackPublication(Track.Source.Microphone)

  return {
    id: participant.sid || resolveParticipantKey(participant),
    identity: participant.identity,
    isLocal: participant.isLocal,
    isMuted: microphonePublication ? microphonePublication.isMuted : !participant.isMicrophoneEnabled,
    isSpeaking: participant.isSpeaking,
  }
}

function buildParticipantList(room: Room) {
  const values = [room.localParticipant, ...Array.from(room.remoteParticipants.values())]
  return values
    .map(mapParticipantSummary)
    .sort((left, right) => {
      if (left.isLocal !== right.isLocal) {
        return left.isLocal ? -1 : 1
      }
      if (left.isSpeaking !== right.isSpeaking) {
        return left.isSpeaking ? -1 : 1
      }
      return left.identity.localeCompare(right.identity, 'zh-Hans-CN')
    })
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return '语音房间连接失败，请稍后重试。'
}

/**
 * @description 统一处理房间加入、离开、成员同步和本地音频能力切换。
 * @param options UseVoiceRoomOptions，包含当前匿名身份和 Toast（轻提示）回调。
 * @returns 语音房间页面需要消费的实时状态和交互方法。
 */
export function useVoiceRoom({ identity, onToast }: UseVoiceRoomOptions) {
  const [participants, setParticipants] = useState<VoiceParticipantSummary[]>([])
  const [roomSnapshots, setRoomSnapshots] = useState<Record<string, VoiceRoomSnapshot>>({})
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [connectingRoomId, setConnectingRoomId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [noiseSupported, setNoiseSupported] = useState<boolean | null>(null)
  const [noiseEnabled, setNoiseEnabled] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [blockedMessage, setBlockedMessage] = useState('')
  const roomRef = useRef<Room | null>(null)
  const roomCleanupRef = useRef<(() => void) | null>(null)
  const audioHostRef = useRef<HTMLDivElement | null>(null)
  const audioElementsRef = useRef(new Map<string, HTMLMediaElement>())
  const participantCleanupRef = useRef(new Map<string, () => void>())
  const krispModulePromiseRef = useRef<Promise<KrispModule> | null>(null)
  const krispProcessorRef = useRef<KrispNoiseFilterProcessor | null>(null)
  const connectingRef = useRef(false)
  const noiseEnabledRef = useRef(false)

  const loadKrispModule = useCallback(() => {
    if (!krispModulePromiseRef.current) {
      krispModulePromiseRef.current = import('@livekit/krisp-noise-filter')
    }

    return krispModulePromiseRef.current
  }, [])

  const resolveNoiseSupport = useCallback(async () => {
    try {
      const module = await loadKrispModule()
      const supported = module.isKrispNoiseFilterSupported()
      setNoiseSupported(supported)
      return supported
    } catch {
      setNoiseSupported(false)
      return false
    }
  }, [loadKrispModule])

  const destroyKrispProcessor = useCallback(async () => {
    if (!krispProcessorRef.current) {
      return
    }

    try {
      await krispProcessorRef.current.destroy()
    } catch (error) {
      appLogger.log({
        level: 'warn',
        category: 'ui',
        action: 'krisp_destroy_failed',
        message: '关闭 Krisp 处理器失败',
        context: error,
      })
    } finally {
      krispProcessorRef.current = null
    }
  }, [])

  const ensureKrispProcessor = useCallback(async () => {
    const supported = await resolveNoiseSupport()
    if (!supported) {
      return null
    }

    if (!krispProcessorRef.current) {
      const module = await loadKrispModule()
      krispProcessorRef.current = module.KrispNoiseFilter()
    }

    return krispProcessorRef.current
  }, [loadKrispModule, resolveNoiseSupport])

  const getLocalAudioTrack = useCallback((room: Room | null) => {
    return room?.localParticipant.getTrackPublication(Track.Source.Microphone)?.audioTrack
  }, [])

  const updateRoomState = useCallback((room: Room, roomId: string) => {
    const nextParticipants = buildParticipantList(room)
    setParticipants(nextParticipants)
    setIsConnected(room.state === ConnectionState.Connected)
    setIsMuted(!room.localParticipant.isMicrophoneEnabled)
    setRoomSnapshots((currentSnapshots) => ({
      ...currentSnapshots,
      [roomId]: {
        roomId,
        participants: nextParticipants,
        updatedAt: Date.now(),
      },
    }))
  }, [])

  const detachRemoteAudio = useCallback((track: RemoteAudioTrack) => {
    const trackKey = resolveTrackKey(track)
    const mountedElement = audioElementsRef.current.get(trackKey)
    if (mountedElement) {
      track.detach(mountedElement)
      mountedElement.remove()
      audioElementsRef.current.delete(trackKey)
      return
    }

    track.detach().forEach((element) => element.remove())
  }, [])

  const detachAllRemoteAudio = useCallback(() => {
    audioElementsRef.current.forEach((element) => element.remove())
    audioElementsRef.current.clear()
  }, [])

  const attachRemoteAudio = useCallback((track: RemoteAudioTrack) => {
    const audioHost = audioHostRef.current
    const trackKey = resolveTrackKey(track)

    if (!audioHost || audioElementsRef.current.has(trackKey)) {
      return
    }

    const element = track.attach()
    element.autoplay = true
    element.dataset.trackSid = trackKey
    audioHost.appendChild(element)
    audioElementsRef.current.set(trackKey, element)
  }, [])

  const cleanupParticipantBindings = useCallback(() => {
    participantCleanupRef.current.forEach((cleanup) => cleanup())
    participantCleanupRef.current.clear()
  }, [])

  const bindParticipant = useCallback(
    (room: Room, roomId: string, participant: Participant) => {
      const participantKey = resolveParticipantKey(participant)
      if (participantCleanupRef.current.has(participantKey)) {
        return
      }

      const syncParticipantState = () => updateRoomState(room, roomId)

      participant.on(ParticipantEvent.IsSpeakingChanged, syncParticipantState)
      participant.on(ParticipantEvent.TrackMuted, syncParticipantState)
      participant.on(ParticipantEvent.TrackUnmuted, syncParticipantState)
      participant.on(ParticipantEvent.LocalTrackPublished, syncParticipantState)
      participant.on(ParticipantEvent.LocalTrackUnpublished, syncParticipantState)
      participant.on(ParticipantEvent.TrackPublished, syncParticipantState)
      participant.on(ParticipantEvent.TrackUnpublished, syncParticipantState)

      participantCleanupRef.current.set(participantKey, () => {
        participant.off(ParticipantEvent.IsSpeakingChanged, syncParticipantState)
        participant.off(ParticipantEvent.TrackMuted, syncParticipantState)
        participant.off(ParticipantEvent.TrackUnmuted, syncParticipantState)
        participant.off(ParticipantEvent.LocalTrackPublished, syncParticipantState)
        participant.off(ParticipantEvent.LocalTrackUnpublished, syncParticipantState)
        participant.off(ParticipantEvent.TrackPublished, syncParticipantState)
        participant.off(ParticipantEvent.TrackUnpublished, syncParticipantState)
      })
    },
    [updateRoomState],
  )

  const bindRoom = useCallback(
    (room: Room, roomId: string) => {
      const handleParticipantConnected = (participant: Participant) => {
        bindParticipant(room, roomId, participant)
        updateRoomState(room, roomId)
      }
      const handleParticipantDisconnected = (participant: Participant) => {
        const participantKey = resolveParticipantKey(participant)
        participantCleanupRef.current.get(participantKey)?.()
        participantCleanupRef.current.delete(participantKey)
        updateRoomState(room, roomId)
      }
      const handleTrackSubscribed = (
        track: RemoteTrack,
        _publication: RemoteTrackPublication,
        participant: RemoteParticipant,
      ) => {
        if (participant.isLocal || !isAudioTrack(track)) {
          updateRoomState(room, roomId)
          return
        }

        attachRemoteAudio(track)
        updateRoomState(room, roomId)
      }
      const handleTrackUnsubscribed = (track: RemoteTrack) => {
        if (isAudioTrack(track)) {
          detachRemoteAudio(track)
        }

        updateRoomState(room, roomId)
      }
      const handleRoomDisconnected = () => {
        setIsConnected(false)
        setIsMuted(true)
        setParticipants([])
        setActiveRoomId(null)
      }
      const handleConnectionStateChanged = () => {
        updateRoomState(room, roomId)
      }

      bindParticipant(room, roomId, room.localParticipant)
      room.remoteParticipants.forEach((participant) => {
        bindParticipant(room, roomId, participant)
      })

      room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track && isAudioTrack(publication.track)) {
            attachRemoteAudio(publication.track)
          }
        })
      })

      room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      room.on(RoomEvent.Disconnected, handleRoomDisconnected)
      room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)

      updateRoomState(room, roomId)

      return () => {
        room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
        room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
        room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
        room.off(RoomEvent.Disconnected, handleRoomDisconnected)
        room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
        cleanupParticipantBindings()
      }
    },
    [attachRemoteAudio, bindParticipant, cleanupParticipantBindings, detachRemoteAudio, updateRoomState],
  )

  const disconnectRoom = useCallback(
    async (options: { keepError?: boolean } = {}) => {
      const activeRoom = roomRef.current
      roomRef.current = null
      connectingRef.current = false
      setConnectingRoomId(null)
      setActiveRoomId(null)
      setIsConnected(false)
      setIsMuted(true)
      setParticipants([])
      if (!options.keepError) {
        setErrorMessage('')
      }

      roomCleanupRef.current?.()
      roomCleanupRef.current = null
      detachAllRemoteAudio()

      if (activeRoom) {
        try {
          await activeRoom.disconnect(true)
        } catch (error) {
          appLogger.log({
            level: 'warn',
            category: 'ui',
            action: 'disconnect_failed',
            message: '离开语音房间时发生异常',
            context: error,
          })
        }
      }

      await destroyKrispProcessor()
    },
    [destroyKrispProcessor, detachAllRemoteAudio],
  )

  const buildAudioCaptureOptions = useCallback(
    async (shouldEnableNoise: boolean) => {
      const baseOptions: AudioCaptureOptions = {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: !shouldEnableNoise,
      }

      if (!shouldEnableNoise) {
        return baseOptions
      }

      const krispProcessor = await ensureKrispProcessor()
      if (!krispProcessor) {
        setNoiseEnabled(false)
        noiseEnabledRef.current = false
        return {
          ...baseOptions,
          noiseSuppression: true,
        } satisfies AudioCaptureOptions
      }

      return {
        ...baseOptions,
        noiseSuppression: false,
        processor: toLiveKitAudioProcessor(krispProcessor),
      } satisfies AudioCaptureOptions
    },
    [ensureKrispProcessor],
  )

  const joinRoom = useCallback(
    async (roomId: string) => {
      if (connectingRef.current) {
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setBlockedMessage(GET_USER_MEDIA_UNSUPPORTED_MESSAGE)
        setErrorMessage(GET_USER_MEDIA_UNSUPPORTED_MESSAGE)
        onToast?.({ type: 'error', message: GET_USER_MEDIA_UNSUPPORTED_MESSAGE })
        return
      }

      if (!appEnv.livekitUrl) {
        setBlockedMessage(LIVEKIT_URL_MISSING_MESSAGE)
        setErrorMessage(LIVEKIT_URL_MISSING_MESSAGE)
        onToast?.({ type: 'error', message: LIVEKIT_URL_MISSING_MESSAGE })
        return
      }

      if (roomRef.current && activeRoomId === roomId && roomRef.current.state === ConnectionState.Connected) {
        return
      }

      connectingRef.current = true
      setBlockedMessage('')
      setErrorMessage('')
      setConnectingRoomId(roomId)

      try {
        const token = await postJson<string, VoiceJoinPayload>(
          '/join',
          { room_id: roomId, identity },
          { baseCandidates: VOICE_BASE_CANDIDATES },
        )

        if (roomRef.current) {
          await disconnectRoom({ keepError: true })
        }

        const nextRoom = new Room()
        roomRef.current = nextRoom
        setActiveRoomId(roomId)
        roomCleanupRef.current = bindRoom(nextRoom, roomId)

        await nextRoom.connect(appEnv.livekitUrl, token)
        await nextRoom.startAudio().catch(() => undefined)

        const captureOptions = await buildAudioCaptureOptions(noiseEnabledRef.current)
        await nextRoom.localParticipant.setMicrophoneEnabled(true, captureOptions)

        updateRoomState(nextRoom, roomId)
        appLogger.log({
          level: 'success',
          category: 'ui',
          action: 'room_joined',
          message: '成功加入语音房间',
          context: { roomId, identity },
        })
      } catch (error) {
        const nextMessage = resolveErrorMessage(error)
        setErrorMessage(nextMessage)
        onToast?.({ type: 'error', message: nextMessage })
        await disconnectRoom({ keepError: true })
      } finally {
        connectingRef.current = false
        setConnectingRoomId(null)
      }
    },
    [activeRoomId, bindRoom, buildAudioCaptureOptions, disconnectRoom, identity, onToast, updateRoomState],
  )

  const leaveRoom = useCallback(async () => {
    await disconnectRoom()
  }, [disconnectRoom])

  const toggleMute = useCallback(async () => {
    const activeRoom = roomRef.current
    if (!activeRoom || connectingRef.current) {
      return
    }

    try {
      const enableMicrophone = !activeRoom.localParticipant.isMicrophoneEnabled
      if (enableMicrophone) {
        const captureOptions = await buildAudioCaptureOptions(noiseEnabledRef.current)
        await activeRoom.localParticipant.setMicrophoneEnabled(true, captureOptions)
      } else {
        await activeRoom.localParticipant.setMicrophoneEnabled(false)
      }

      if (activeRoomId) {
        updateRoomState(activeRoom, activeRoomId)
      }
    } catch (error) {
      const nextMessage = resolveErrorMessage(error)
      setErrorMessage(nextMessage)
      onToast?.({ type: 'error', message: nextMessage })
    }
  }, [activeRoomId, buildAudioCaptureOptions, onToast, updateRoomState])

  const toggleNoise = useCallback(async () => {
    const nextNoiseEnabled = !noiseEnabledRef.current
    noiseEnabledRef.current = nextNoiseEnabled
    setNoiseEnabled(nextNoiseEnabled)

    const supported = noiseSupported ?? (await resolveNoiseSupport())
    if (!supported) {
      noiseEnabledRef.current = false
      setNoiseEnabled(false)
      return
    }

    const activeRoom = roomRef.current
    const localAudioTrack = getLocalAudioTrack(activeRoom)
    if (!activeRoom || !localAudioTrack) {
      return
    }

    try {
      if (nextNoiseEnabled) {
        const krispProcessor = await ensureKrispProcessor()
        if (!krispProcessor) {
          noiseEnabledRef.current = false
          setNoiseEnabled(false)
          return
        }

        await localAudioTrack.setProcessor(toLiveKitAudioProcessor(krispProcessor))
      } else {
        await localAudioTrack.stopProcessor()
        await destroyKrispProcessor()
      }
    } catch (error) {
      const nextMessage = resolveErrorMessage(error)
      noiseEnabledRef.current = !nextNoiseEnabled
      setNoiseEnabled(!nextNoiseEnabled)
      setErrorMessage(nextMessage)
      onToast?.({ type: 'error', message: nextMessage })
    }
  }, [destroyKrispProcessor, ensureKrispProcessor, getLocalAudioTrack, noiseSupported, onToast, resolveNoiseSupport])

  useEffect(() => {
    noiseEnabledRef.current = noiseEnabled
  }, [noiseEnabled])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const audioHost = document.createElement('div')
    audioHost.dataset[AUDIO_HOST_DATASET_KEY] = 'true'
    audioHost.style.position = 'absolute'
    audioHost.style.width = '0'
    audioHost.style.height = '0'
    audioHost.style.overflow = 'hidden'
    audioHost.style.pointerEvents = 'none'
    document.body.appendChild(audioHost)
    audioHostRef.current = audioHost

    return () => {
      audioHost.remove()
      audioHostRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setBlockedMessage(GET_USER_MEDIA_UNSUPPORTED_MESSAGE)
      return
    }

    if (!appEnv.livekitUrl) {
      setBlockedMessage(LIVEKIT_URL_MISSING_MESSAGE)
    }
  }, [])

  useEffect(() => {
    let canceled = false

    void (async () => {
      const supported = await resolveNoiseSupport()
      if (canceled) {
        return
      }

      setNoiseSupported(supported)
      setNoiseEnabled(supported)
      noiseEnabledRef.current = supported
    })()

    return () => {
      canceled = true
    }
  }, [resolveNoiseSupport])

  useEffect(() => {
    return () => {
      void disconnectRoom({ keepError: true })
    }
  }, [disconnectRoom])

  return {
    activeRoomId,
    blockedMessage,
    connectingRoomId,
    errorMessage,
    isConnected,
    isMuted,
    joinRoom,
    leaveRoom,
    noiseEnabled,
    noiseSupported,
    participants,
    roomSnapshots,
    toggleMute,
    toggleNoise,
  }
}
