/** 负责渲染独立语音页，并组合房间列表、连接控制和浏览器提示。 */
import type { ToastState } from '@/components/Toast'
import { MicButton } from '@/components/voice/MicButton'
import { NoiseToggle } from '@/components/voice/NoiseToggle'
import { PageTabs } from '@/components/voice/PageTabs'
import { RoomCard } from '@/components/voice/RoomCard'
import { useIdentity } from '@/hooks/useIdentity'
import { useVoiceRoom } from '@/hooks/useVoiceRoom'
import { VOICE_ROOMS } from '@/types/voice'

interface VoicePageProps {
  onOpenPosts: () => void
  onToast: (toast: ToastState) => void
}

function buildIdentityPreview(identity: string) {
  return identity.length > 14 ? `${identity.slice(0, 8)}…${identity.slice(-4)}` : identity
}

/**
 * @description 用现有论坛视觉体系渲染语音房间页，提供房间切换、本地音频控制和成员可视化状态。
 * @param props VoicePageProps，包含帖子页切换入口和全局 Toast（轻提示）回调。
 * @returns React 语音页面组件。
 */
export function VoicePage({ onOpenPosts, onToast }: VoicePageProps) {
  const identity = useIdentity()
  const {
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
  } = useVoiceRoom({
    identity,
    onToast,
  })

  const activeRoom = VOICE_ROOMS.find((room) => room.id === activeRoomId) ?? null

  return (
    <div className="voice-page">
      <div className="voice-shell">
        <header className="forum-topbar voice-topbar">
          <div className="voice-topbar__left">
            <div className="forum-brand" aria-label="mono voice">
              <span className="forum-brand__dot" />
              <span className="forum-brand__text">mono</span>
            </div>
            <PageTabs activeTab="voice" onOpenPosts={onOpenPosts} onOpenVoice={() => undefined} />
          </div>

          <div className="voice-topbar__status">
            <span className="voice-topbar__label">匿名身份</span>
            <strong title={identity}>{buildIdentityPreview(identity)}</strong>
          </div>
        </header>

        <main className="voice-layout voice-layout--hub">
          <section className="voice-panel voice-stage-card voice-stage-card--hub">
            <div className="voice-stage-card__inner">
              <div className="voice-stage-card__heading voice-stage-card__heading--compact">
                <h1>语音分组</h1>
              </div>

              <div className="voice-room-list">
                {VOICE_ROOMS.map((room) => {
                  const snapshot = roomSnapshots[room.id]
                  const roomParticipants = activeRoomId === room.id ? participants : snapshot?.participants ?? []
                  const emptyText =
                    activeRoomId === room.id
                      ? '当前房间还没有其他成员，稍后会自动刷新。'
                      : snapshot
                        ? '这里展示的是你上次进入该房间时看到的成员。'
                        : '进入房间后显示实时成员'

                  return (
                    <RoomCard
                      disabled={Boolean(blockedMessage)}
                      emptyText={emptyText}
                      isActive={activeRoomId === room.id}
                      isLoading={connectingRoomId === room.id}
                      key={room.id}
                      onJoin={(nextRoom) => {
                        void joinRoom(nextRoom.id)
                      }}
                      participants={roomParticipants}
                      room={room}
                    />
                  )
                })}
              </div>

              {blockedMessage ? <div className="voice-state-banner voice-state-banner--error">{blockedMessage}</div> : null}
              {!blockedMessage && errorMessage ? <div className="voice-state-banner voice-state-banner--error">{errorMessage}</div> : null}

              <div className="voice-hub-footer">
                <div className="voice-hub-footer__status">
                  <span className={isConnected ? 'voice-status-chip voice-status-chip--online' : 'voice-status-chip'}>
                    {activeRoom ? `已连接 ${activeRoom.name}` : '尚未加入频道'}
                  </span>
                  <span className="voice-status-chip">{noiseEnabled ? '降噪已开启' : '降噪已关闭'}</span>
                  <span className="voice-status-chip">{isMuted ? '麦克风已静音' : '麦克风已开启'}</span>
                </div>

                <div className="voice-hub-footer__controls">
                  <MicButton disabled={!isConnected} isMuted={isMuted} onClick={toggleMute} />
                  <NoiseToggle checked={noiseEnabled} onToggle={toggleNoise} supported={noiseSupported} />
                  <button
                    className="forum-pill-button forum-pill-button--ghost voice-leave-button"
                    disabled={!isConnected}
                    onClick={() => {
                      void leaveRoom()
                    }}
                    type="button"
                  >
                    离开房间
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
