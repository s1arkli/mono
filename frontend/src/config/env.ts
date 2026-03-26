const title = import.meta.env.VITE_APP_TITLE?.trim() || 'mono token portal'

const rawBasePath = import.meta.env.VITE_API_BASE_PATH?.trim() || '/account'

export const appEnv = {
  title,
  apiBasePath: rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`,
}

