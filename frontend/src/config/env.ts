/** 负责读取并规整前端运行时环境变量。 */
const title = import.meta.env.VITE_APP_TITLE?.trim() || 'mono token portal'

const rawBasePath = import.meta.env.VITE_API_BASE_PATH?.trim() || '/api/v1/account'
const livekitUrl = import.meta.env.VITE_LIVEKIT_URL?.trim() || ''

/** 当前前端应用可直接消费的环境配置集合。 */
export const appEnv = {
  dev: import.meta.env.DEV,
  title,
  apiBasePath: rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`,
  livekitUrl,
}
