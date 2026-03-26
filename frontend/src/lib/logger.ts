import { useEffect, useSyncExternalStore } from 'react'

export type LogLevel = 'info' | 'success' | 'warn' | 'error'
export type LogCategory = 'request' | 'auth' | 'post' | 'ui' | 'system'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  action: string
  message: string
  context?: unknown
  status?: number
  durationMs?: number
}

interface LoggerState {
  entries: LogEntry[]
}

interface LogPayload {
  level: LogLevel
  category: LogCategory
  action: string
  message: string
  context?: unknown
  status?: number
  durationMs?: number
}

const STORAGE_KEY = 'mono_frontend_logs'
const PANEL_KEY = 'mono_frontend_logs_panel_open'
const PANEL_SIZE_KEY = 'mono_frontend_logs_panel_size'
const MAX_ENTRIES = 250
const listeners = new Set<() => void>()
const sensitiveKeyPattern = /(password|token|authorization|cookie|secret|credential)/i

let state: LoggerState = { entries: [] }

function isBrowser() {
  return typeof window !== 'undefined'
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function maskSecret(value: string) {
  if (value.length <= 8) {
    return '[REDACTED]'
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value == null) {
    return value
  }

  if (depth > 3) {
    return '[TRUNCATED]'
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack?.split('\n').slice(0, 4).join('\n'),
    }
  }

  if (typeof value === 'string') {
    if (value.startsWith('Bearer ')) {
      return `Bearer ${maskSecret(value.slice(7))}`
    }
    return value.length > 400 ? `${value.slice(0, 400)}...` : value
  }

  if (typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1))
  }

  const output: Record<string, unknown> = {}
  const entries = Object.entries(value as Record<string, unknown>).slice(0, 30)
  for (const [key, item] of entries) {
    if (sensitiveKeyPattern.test(key)) {
      output[key] = typeof item === 'string' ? maskSecret(item) : '[REDACTED]'
      continue
    }
    output[key] = sanitizeValue(item, depth + 1)
  }
  return output
}

function persist() {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries))
  } catch {
    // ignore quota errors
  }
}

function emit() {
  persist()
  for (const listener of listeners) {
    listener()
  }
}

function loadState() {
  if (!isBrowser()) {
    return
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }

    const entries = JSON.parse(raw) as LogEntry[]
    if (Array.isArray(entries)) {
      state = {
        entries: entries.slice(-MAX_ENTRIES),
      }
    }
  } catch {
    state = { entries: [] }
  }
}

loadState()

export const appLogger = {
  log(payload: LogPayload) {
    const entry: LogEntry = {
      id: createId(),
      timestamp: new Date().toISOString(),
      level: payload.level,
      category: payload.category,
      action: payload.action,
      message: payload.message,
      context: sanitizeValue(payload.context),
    }
    if (payload.status != null) {
      entry.status = payload.status
    }
    if (payload.durationMs != null) {
      entry.durationMs = Math.round(payload.durationMs)
    }

    state = {
      entries: [...state.entries, entry].slice(-MAX_ENTRIES),
    }
    emit()
    return entry
  },
  clear() {
    state = { entries: [] }
    emit()
  },
  getState() {
    return state
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  exportText() {
    return state.entries
      .map((entry) => {
        const summary = [
          `[${entry.timestamp}]`,
          entry.level.toUpperCase(),
          entry.category,
          entry.action,
          entry.message,
          entry.status ? `status=${entry.status}` : '',
          entry.durationMs ? `duration=${entry.durationMs}ms` : '',
        ]
          .filter(Boolean)
          .join(' | ')

        if (!entry.context) {
          return summary
        }

        return `${summary}\n${JSON.stringify(entry.context, null, 2)}`
      })
      .join('\n\n')
  },
  getPanelOpen() {
    if (!isBrowser()) {
      return false
    }
    return window.localStorage.getItem(PANEL_KEY) === '1'
  },
  setPanelOpen(open: boolean) {
    if (!isBrowser()) {
      return
    }
    window.localStorage.setItem(PANEL_KEY, open ? '1' : '0')
  },
  getPanelSize() {
    if (!isBrowser()) {
      return null
    }

    try {
      const raw = window.localStorage.getItem(PANEL_SIZE_KEY)
      if (!raw) {
        return null
      }

      const parsed = JSON.parse(raw) as { width?: number; height?: number }
      if (!parsed.width || !parsed.height) {
        return null
      }

      return {
        width: parsed.width,
        height: parsed.height,
      }
    } catch {
      return null
    }
  },
  setPanelSize(size: { width: number; height: number }) {
    if (!isBrowser()) {
      return
    }

    window.localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify(size))
  },
}

export function useLogStore() {
  return useSyncExternalStore(appLogger.subscribe, appLogger.getState, appLogger.getState)
}

export function useBrowserLogBridge() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      appLogger.log({
        level: 'error',
        category: 'system',
        action: 'window_error',
        message: event.message || '捕获到未处理脚本错误',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    }

    function handleRejection(event: PromiseRejectionEvent) {
      appLogger.log({
        level: 'error',
        category: 'system',
        action: 'unhandled_rejection',
        message: '捕获到未处理 Promise 异常',
        context: event.reason,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])
}
