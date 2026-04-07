/** 负责声明语音房间页面共享的房间、成员与快照类型。 */
export interface VoiceRoomInfo {
  id: string
  name: string
}

export interface VoiceParticipantSummary {
  id: string
  identity: string
  isLocal: boolean
  isMuted: boolean
  isSpeaking: boolean
}

export interface VoiceRoomSnapshot {
  roomId: string
  participants: VoiceParticipantSummary[]
  updatedAt: number
}

export interface VoiceJoinPayload {
  room_id: string
  identity: string
}

export const VOICE_ROOMS: VoiceRoomInfo[] = [
  { id: 'room-general', name: '房间一' },
  { id: 'room-squad-a', name: '房间二' },
  { id: 'room-squad-b', name: '房间三' },
]
