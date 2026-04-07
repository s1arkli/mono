/** 负责集中提供语音页面使用的 SVG（可缩放矢量图形）图标。 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.8,
} satisfies IconProps

export function MicIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18" {...props}>
      <path {...iconProps} d="M12 3a3 3 0 0 0-3 3v5a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path {...iconProps} d="M6 11a6 6 0 0 0 12 0" />
      <path {...iconProps} d="M12 17v4" />
      <path {...iconProps} d="M9 21h6" />
    </svg>
  )
}

export function MicOffIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18" {...props}>
      <path {...iconProps} d="M9 6.4V11a3 3 0 0 0 4.8 2.4" />
      <path {...iconProps} d="M15 8.5V6a3 3 0 0 0-5.3-1.9" />
      <path {...iconProps} d="M6 11a6 6 0 0 0 9.5 4.9" />
      <path {...iconProps} d="M12 17v4" />
      <path {...iconProps} d="M9 21h6" />
      <path {...iconProps} d="m4 4 16 16" />
    </svg>
  )
}

export function NoiseIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18" {...props}>
      <path {...iconProps} d="M4 12h3l3-7 4 14 3-7h3" />
    </svg>
  )
}
