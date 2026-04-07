/** 负责渲染本地麦克风开关按钮。 */
import { MicIcon, MicOffIcon } from '@/components/voice/VoiceIcons'

interface MicButtonProps {
  disabled?: boolean
  isMuted: boolean
  onClick: () => void
}

/**
 * @description 根据当前静音态切换按钮文案和图标，供用户快速开关本地麦克风。
 * @param props MicButtonProps，包含静音状态、禁用状态与点击回调。
 * @returns React 麦克风控制按钮。
 */
export function MicButton({ disabled = false, isMuted, onClick }: MicButtonProps) {
  return (
    <button
      aria-label={isMuted ? '打开麦克风' : '关闭麦克风'}
      className={isMuted ? 'voice-control-button voice-control-button--muted' : 'voice-control-button'}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="voice-control-button__icon">{isMuted ? <MicOffIcon /> : <MicIcon />}</span>
      <span>{isMuted ? '打开麦克风' : '麦克风已开'}</span>
    </button>
  )
}
