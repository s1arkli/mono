/** 负责渲染 Krisp（降噪引擎）开关和兼容性说明。 */
import { NoiseIcon } from '@/components/voice/VoiceIcons'

interface NoiseToggleProps {
  checked: boolean
  disabled?: boolean
  supported: boolean | null
  onToggle: () => void
}

/**
 * @description 展示当前浏览器的降噪支持情况，并允许用户切换 Krisp 噪声抑制。
 * @param props NoiseToggleProps，包含开关状态、兼容性和点击回调。
 * @returns React 降噪开关组件。
 */
export function NoiseToggle({ checked, disabled = false, supported, onToggle }: NoiseToggleProps) {
  const description =
    supported === null
      ? '正在检测浏览器降噪能力…'
      : supported
        ? 'Krisp 降噪会在连接成功后应用到本地麦克风。'
        : '降噪不支持当前浏览器'

  return (
    <div className="voice-noise-toggle">
      <div className="voice-noise-toggle__copy">
        <div className="voice-noise-toggle__title">
          <NoiseIcon />
          <span>噪声抑制</span>
        </div>
        <p>{description}</p>
      </div>

      <button
        aria-checked={checked}
        aria-label="切换降噪开关"
        className={checked ? 'voice-toggle is-active' : 'voice-toggle'}
        disabled={disabled || supported !== true}
        onClick={onToggle}
        role="switch"
        type="button"
      >
        <span className="voice-toggle__thumb" />
      </button>
    </div>
  )
}
