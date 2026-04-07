/** 负责渲染单个语音房间卡片及其成员列表。 */
import { ParticipantChip } from '@/components/voice/ParticipantChip'
import type { VoiceParticipantSummary, VoiceRoomInfo } from '@/types/voice'

interface RoomCardProps {
  disabled?: boolean
  emptyText?: string
  isActive: boolean
  isLoading: boolean
  onJoin: (room: VoiceRoomInfo) => void
  participants: VoiceParticipantSummary[]
  room: VoiceRoomInfo
}

const roomIcons: Record<string, string> = {
  'room-general': '⌘',
  'room-squad-a': '✦',
  'room-squad-b': '🔊',
}

/**
 * @description 统一渲染房间标题、人数徽标、加入按钮和参与者标签列表。
 * @param props RoomCardProps，房间信息、活跃状态与参与者列表。
 * @returns React 语音房间卡片组件。
 */
export function RoomCard({
  disabled = false,
  emptyText = '进入房间后显示实时成员',
  isActive,
  isLoading,
  onJoin,
  participants,
  room,
}: RoomCardProps) {
  const countText = `${String(participants.length).padStart(2, '0')} / ${isActive ? '19' : room.id === 'room-general' ? '26' : '25'}`
  const actionText = isLoading ? '连接中…' : isActive ? countText : countText

  return (
    <article className={isActive ? 'voice-room-row voice-room-row--active' : 'voice-room-row'}>
      <button
        className="voice-room-row__button"
        disabled={disabled || isLoading}
        onClick={() => {
          if (!isActive) {
            onJoin(room)
          }
        }}
        type="button"
      >
        <div className="voice-room-row__left">
          <span className="voice-room-row__icon" aria-hidden="true">
            {roomIcons[room.id] ?? '•'}
          </span>
          <span className="voice-room-row__name">{room.name}</span>
        </div>

        <span className="voice-room-row__count">{disabled && !isActive ? '暂不可用' : actionText}</span>
      </button>

      {isActive ? (
        <div className="voice-room-row__details">
          <div className="voice-room-row__participants">
            {participants.length > 0 ? participants.map((participant) => <ParticipantChip key={participant.id} participant={participant} />) : null}
            {participants.length === 0 ? <p className="voice-room-card__empty">{emptyText}</p> : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}
