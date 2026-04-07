/** 负责引入 Vite（前端构建工具）默认提供的环境变量类型声明。 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string
  readonly VITE_API_BASE_PATH?: string
  readonly VITE_LIVEKIT_URL?: string
}
