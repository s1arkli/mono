import { appEnv } from '../config/env'
import { appLogger } from './logger'
import type { ApiResponse } from '../types/api'

const defaultBaseCandidates = ['/account', '/api/v1/account']

interface PostJsonOptions {
  accessToken?: string
  baseCandidates?: string[]
}

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

export async function postJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
  options: PostJsonOptions = {},
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
        throw new Error(`HTTP ${response.status}`)
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
        throw new Error(result.msg || '请求失败')
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
        error instanceof Error ? error : new Error('网络请求失败，请稍后再试')
    }
  }

  throw lastError ?? new Error('接口不可用，请检查网关服务是否已启动')
}
