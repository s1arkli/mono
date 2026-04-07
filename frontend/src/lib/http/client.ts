/** 负责封装带候选基路径回退能力的 POST 请求调用。 */
import { appEnv } from '@/config/env'
import { HttpRequestError, SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/http/errors'
import { appLogger } from '@/lib/logger'
import type { PostRequestOptions } from '@/lib/http/types'
import type { ApiResponse } from '@/types/api'

const defaultBaseCandidates = ['/api/v1/account', '/account']

/**
 * @description 合并并去重候选接口前缀，兼容网关路径和直连服务路径。
 * @param candidates string[] | undefined，调用方显式传入的候选路径。
 * @returns string[]，按优先级排列的唯一候选路径列表。
 */
function buildBaseCandidates(candidates?: string[]) {
  const seen = new Set<string>()
  const values = candidates ?? [appEnv.apiBasePath, ...defaultBaseCandidates]

  return values.filter((value) => {
    if (!value || seen.has(value)) {
      return false
    }

    seen.add(value)
    return true
  })
}

/**
 * @description 发送 JSON（JavaScript 对象表示法）格式的 POST 请求，并在 404 时自动尝试下一个候选基路径。
 * @param path string，接口相对路径。
 * @param payload TPayload，请求体数据。
 * @param options PostRequestOptions，请求附加配置，例如 Token（令牌）和候选基路径。
 * @returns Promise<TResponse>，后端业务成功后的 data 字段。
 * @example
 * ```ts
 * const data = await postJson<LoginData, LoginPayload>('/auth', {
 *   account: 'demo',
 *   password: '12345678',
 * })
 * ```
 */
export async function postJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
  options: PostRequestOptions = {},
) {
  let lastError: Error | null = null

  for (const basePath of buildBaseCandidates(options.baseCandidates)) {
    const requestUrl = `${basePath}${path}`
    const startedAt = performance.now()

    appLogger.log({
      level: 'info',
      category: 'request',
      action: 'request_start',
      message: `发起 POST ${requestUrl}`,
      context: {
        method: 'POST',
        url: requestUrl,
        payload,
        headers: options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined,
      },
    })

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (options.accessToken) {
        headers.Authorization = `Bearer ${options.accessToken}`
      }

      const response = await fetch(`${basePath}${path}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.status === 404) {
        // 404 更像是当前前缀没命中服务，继续尝试下一个候选地址比直接报错更适合联调场景。
        appLogger.log({
          level: 'warn',
          category: 'request',
          action: 'request_fallback',
          message: `接口 ${requestUrl} 返回 404，准备尝试下一个候选地址`,
          status: 404,
          durationMs: performance.now() - startedAt,
        })
        continue
      }

      if (!response.ok) {
        appLogger.log({
          level: 'error',
          category: 'request',
          action: 'request_http_error',
          message: `接口 ${requestUrl} 返回 HTTP ${response.status}`,
          status: response.status,
          durationMs: performance.now() - startedAt,
        })
        if (response.status >= 500) {
          throw new HttpRequestError(SERVICE_UNAVAILABLE_MESSAGE, {
            kind: 'service_unavailable',
            status: response.status,
          })
        }
        throw new HttpRequestError(`HTTP ${response.status}`, {
          kind: 'request',
          status: response.status,
        })
      }

      const result = (await response.json()) as ApiResponse<TResponse>

      if (result.code !== 0) {
        appLogger.log({
          level: 'warn',
          category: 'request',
          action: 'request_business_error',
          message: `接口 ${requestUrl} 返回业务错误`,
          status: result.code,
          durationMs: performance.now() - startedAt,
          context: result,
        })
        throw new HttpRequestError(result.msg || '请求失败', {
          kind: 'request',
          status: result.code,
        })
      }

      appLogger.log({
        level: 'success',
        category: 'request',
        action: 'request_success',
        message: `接口 ${requestUrl} 调用成功`,
        status: response.status,
        durationMs: performance.now() - startedAt,
        context: result,
      })

      return result.data as TResponse
    } catch (error) {
      appLogger.log({
        level: 'error',
        category: 'request',
        action: 'request_exception',
        message: `接口 ${requestUrl} 调用异常`,
        durationMs: performance.now() - startedAt,
        context: error,
      })
      lastError =
        error instanceof HttpRequestError
          ? error
          : new HttpRequestError(SERVICE_UNAVAILABLE_MESSAGE, {
              kind: 'service_unavailable',
            })
      // 进入异常分支时通常是网络失败或服务异常，继续切换前缀意义不大，直接交给页面层处理。
      break
    }
  }

  throw lastError ?? new HttpRequestError(SERVICE_UNAVAILABLE_MESSAGE, { kind: 'service_unavailable' })
}

/**
 * @description 发送 FormData（表单数据）格式的 POST 请求，常用于文件上传场景。
 * @param path string，接口相对路径。
 * @param payload FormData，浏览器原生表单数据对象。
 * @param options PostRequestOptions，请求附加配置，例如 Token（令牌）和候选基路径。
 * @returns Promise<TResponse>，后端业务成功后的 data 字段。
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('file', file)
 * const data = await postForm<UploadAvatarData>('/upload/avatar', formData)
 * ```
 */
export async function postForm<TResponse>(
  path: string,
  payload: FormData,
  options: PostRequestOptions = {},
) {
  let lastError: Error | null = null

  for (const basePath of buildBaseCandidates(options.baseCandidates)) {
    const requestUrl = `${basePath}${path}`
    const startedAt = performance.now()

    appLogger.log({
      level: 'info',
      category: 'request',
      action: 'request_start',
      message: `发起 FORM POST ${requestUrl}`,
      context: {
        method: 'POST',
        url: requestUrl,
        headers: options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined,
      },
    })

    try {
      const headers: Record<string, string> = {}
      if (options.accessToken) {
        headers.Authorization = `Bearer ${options.accessToken}`
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: payload,
      })

      if (response.status === 404) {
        // 文件上传也复用候选前缀回退，便于网关路由尚未完全稳定时继续联调。
        appLogger.log({
          level: 'warn',
          category: 'request',
          action: 'request_fallback',
          message: `接口 ${requestUrl} 返回 404，准备尝试下一个候选地址`,
          status: 404,
          durationMs: performance.now() - startedAt,
        })
        continue
      }

      if (!response.ok) {
        appLogger.log({
          level: 'error',
          category: 'request',
          action: 'request_http_error',
          message: `接口 ${requestUrl} 返回 HTTP ${response.status}`,
          status: response.status,
          durationMs: performance.now() - startedAt,
        })
        if (response.status >= 500) {
          throw new HttpRequestError(SERVICE_UNAVAILABLE_MESSAGE, {
            kind: 'service_unavailable',
            status: response.status,
          })
        }
        throw new HttpRequestError(`HTTP ${response.status}`, {
          kind: 'request',
          status: response.status,
        })
      }

      const result = (await response.json()) as ApiResponse<TResponse>

      if (result.code !== 0) {
        appLogger.log({
          level: 'warn',
          category: 'request',
          action: 'request_business_error',
          message: `接口 ${requestUrl} 返回业务错误`,
          status: result.code,
          durationMs: performance.now() - startedAt,
          context: result,
        })
        throw new HttpRequestError(result.msg || '请求失败', {
          kind: 'request',
          status: result.code,
        })
      }

      appLogger.log({
        level: 'success',
        category: 'request',
        action: 'request_success',
        message: `接口 ${requestUrl} 调用成功`,
        status: response.status,
        durationMs: performance.now() - startedAt,
        context: result,
      })

      return result.data as TResponse
    } catch (error) {
      appLogger.log({
        level: 'error',
        category: 'request',
        action: 'request_exception',
        message: `接口 ${requestUrl} 调用异常`,
        durationMs: performance.now() - startedAt,
        context: error,
      })
      lastError =
        error instanceof HttpRequestError
          ? error
          : new HttpRequestError(SERVICE_UNAVAILABLE_MESSAGE, {
              kind: 'service_unavailable',
            })
      break
    }
  }

  throw lastError ?? new HttpRequestError(SERVICE_UNAVAILABLE_MESSAGE, { kind: 'service_unavailable' })
}
