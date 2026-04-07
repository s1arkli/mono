/** 负责渲染语音房间中的单个参与者状态标签。 */
import { buildAvatarStyle } from '@/utils/avatar'
import type { VoiceParticipantSummary } from '@/types/voice'
import { MicOffIcon } from '@/components/voice/VoiceIcons'

interface ParticipantChipProps {
  participant: VoiceParticipantSummary
}

function hashIdentity(identity: string) {
  let value = 0
  for (let index = 0; index < identity.length; index += 1) {
    value = (value * 31 + identity.charCodeAt(index)) >>> 0
  }
  return value
}

function buildIdentityAvatar(identity: string) {
  const seed = hashIdentity(identity)
  const hue = seed % 360
  return buildAvatarStyle(
    `linear-gradient(135deg, hsl(${hue} 78% 74%) 0%, hsl(${(hue + 36) % 360} 72% 48%) 100%)`,
    seed,
  )
}

function buildIdentityMonogram(identity: string) {
  const compactIdentity = identity.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2)
  return compactIdentity ? compactIdentity.toUpperCase() : 'VC'
}

/**
 * @description 用标签形式展示参与者身份、说话态和静音态，便于房间内快速识别成员状态。
 * @param props ParticipantChipProps，当前参与者的展示摘要。
 * @returns React 参与者标签组件。
 */
export function ParticipantChip({ participant }: ParticipantChipProps) {
  return (
    <div
      className={[
        'voice-participant-chip',
        participant.isSpeaking ? 'voice-participant-chip--speaking' : '',
        participant.isMuted ? 'voice-participant-chip--muted' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={participant.identity}
    >
      <span className="voice-participant-chip__avatar" style={buildIdentityAvatar(participant.identity)}>
        {buildIdentityMonogram(participant.identity)}
      </span>

      <span className="voice-participant-chip__copy">
        <span className="voice-participant-chip__name">{participant.identity}</span>
        {participant.isLocal ? <span className="voice-participant-chip__meta">本机</span> : null}
      </span>

      {participant.isMuted ? (
        <span aria-label="麦克风已静音" className="voice-participant-chip__icon" title="麦克风已静音">
          <MicOffIcon />
        </span>
      ) : null}
    </div>
  )
}
