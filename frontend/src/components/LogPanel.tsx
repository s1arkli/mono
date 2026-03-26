import { useEffect, useMemo, useRef, useState } from 'react'
import { appLogger, type LogCategory, type LogEntry, type LogLevel, useLogStore } from '../lib/logger'

const levelOptions: Array<{ label: string; value: LogLevel | 'all' }> = [
  { label: '全部', value: 'all' },
  { label: '信息', value: 'info' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warn' },
  { label: '错误', value: 'error' },
]

const categoryOptions: Array<{ label: string; value: LogCategory | 'all' }> = [
  { label: '全部模块', value: 'all' },
  { label: '请求', value: 'request' },
  { label: '认证', value: 'auth' },
  { label: '帖子', value: 'post' },
  { label: '交互', value: 'ui' },
  { label: '系统', value: 'system' },
]

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour12: false,
  })
}

function getLevelLabel(level: LogLevel) {
  if (level === 'success') {
    return '成功'
  }
  if (level === 'warn') {
    return '警告'
  }
  if (level === 'error') {
    return '错误'
  }
  return '信息'
}

function getCategoryLabel(category: LogCategory) {
  if (category === 'request') {
    return '请求'
  }
  if (category === 'auth') {
    return '认证'
  }
  if (category === 'post') {
    return '帖子'
  }
  if (category === 'ui') {
    return '交互'
  }
  return '系统'
}

function buildSearchText(entry: LogEntry) {
  return [
    entry.message,
    entry.action,
    entry.category,
    entry.level,
    entry.status,
    entry.context ? JSON.stringify(entry.context) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function LogPanel() {
  const { entries } = useLogStore()
  const [open, setOpen] = useState(() => appLogger.getPanelOpen())
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<LogLevel | 'all'>('all')
  const [category, setCategory] = useState<LogCategory | 'all'>('all')
  const panelRef = useRef<HTMLElement | null>(null)
  const enterHitsRef = useRef<number[]>([])
  const [panelSize, setPanelSize] = useState(() => appLogger.getPanelSize())

  useEffect(() => {
    appLogger.setPanelOpen(open)
  }, [open])

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || event.isComposing) {
        return
      }

      const now = Date.now()
      enterHitsRef.current = [...enterHitsRef.current.filter((time) => now - time < 900), now]

      if (enterHitsRef.current.length >= 3) {
        enterHitsRef.current = []
        event.preventDefault()
        setOpen((prev) => {
          const next = !prev
          appLogger.log({
            level: 'info',
            category: 'ui',
            action: next ? 'logs_open_shortcut' : 'logs_close_shortcut',
            message: next ? '通过连续三次 Enter 打开日志台' : '通过连续三次 Enter 关闭日志台',
          })
          return next
        })
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  useEffect(() => {
    if (!open || !panelRef.current || typeof ResizeObserver === 'undefined') {
      return
    }

    const element = panelRef.current
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      const nextSize = {
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      }
      setPanelSize(nextSize)
      appLogger.setPanelSize(nextSize)
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [open])

  const metrics = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        acc.total += 1
        if (entry.level === 'error') {
          acc.errors += 1
        }
        if (entry.level === 'warn') {
          acc.warns += 1
        }
        if (entry.category === 'request') {
          acc.requests += 1
        }
        return acc
      },
      { total: 0, errors: 0, warns: 0, requests: 0 },
    )
  }, [entries])

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return [...entries]
      .reverse()
      .filter((entry) => {
        if (level !== 'all' && entry.level !== level) {
          return false
        }
        if (category !== 'all' && entry.category !== category) {
          return false
        }
        if (!normalizedQuery) {
          return true
        }
        return buildSearchText(entry).includes(normalizedQuery)
      })
  }, [category, entries, level, query])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(appLogger.exportText())
      appLogger.log({
        level: 'success',
        category: 'ui',
        action: 'logs_copy',
        message: '已复制日志内容到剪贴板',
      })
    } catch (error) {
      appLogger.log({
        level: 'error',
        category: 'ui',
        action: 'logs_copy_failed',
        message: '复制日志内容失败',
        context: error,
      })
    }
  }

  function handleExport() {
    const blob = new Blob([appLogger.exportText()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mono-frontend-logs-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)

    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'logs_export',
      message: '已导出日志文件',
    })
  }

  function handleClear() {
    appLogger.clear()
    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'logs_clear',
      message: '日志已清空',
    })
  }

  return (
    <>
      <button
        aria-expanded={open}
        className={open ? 'log-console-toggle is-open' : 'log-console-toggle'}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="log-console-toggle__title">运行日志</span>
        <span className="log-console-toggle__meta">{metrics.total} 条</span>
        {metrics.errors > 0 ? <span className="log-console-toggle__badge">{metrics.errors} 错误</span> : null}
      </button>

      {open ? (
        <aside
          className="log-console"
          ref={panelRef}
          style={
            panelSize
              ? {
                  width: `${panelSize.width}px`,
                  height: `${panelSize.height}px`,
                }
              : undefined
          }
        >
          <div className="log-console__header">
            <div>
              <p className="log-console__eyebrow">Frontend Ops</p>
              <h3>前端日志控制台</h3>
              <p className="log-console__description">自动记录请求、用户动作、系统异常，支持本地持久化、导出和窗口缩放。</p>
            </div>
            <button className="log-console__close" onClick={() => setOpen(false)} type="button">
              收起
            </button>
          </div>

          <div className="log-console__metrics">
            <div className="log-metric">
              <span>总量</span>
              <strong>{metrics.total}</strong>
            </div>
            <div className="log-metric">
              <span>请求</span>
              <strong>{metrics.requests}</strong>
            </div>
            <div className="log-metric">
              <span>警告</span>
              <strong>{metrics.warns}</strong>
            </div>
            <div className="log-metric log-metric--danger">
              <span>错误</span>
              <strong>{metrics.errors}</strong>
            </div>
          </div>

          <div className="log-console__toolbar">
            <input
              className="log-console__search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索 message、action、context..."
              value={query}
            />

            <div className="log-console__filters">
              <select onChange={(event) => setLevel(event.target.value as LogLevel | 'all')} value={level}>
                {levelOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select onChange={(event) => setCategory(event.target.value as LogCategory | 'all')} value={category}>
                {categoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="log-console__actions">
              <button onClick={handleCopy} type="button">
                复制
              </button>
              <button onClick={handleExport} type="button">
                导出
              </button>
              <button className="is-danger" onClick={handleClear} type="button">
                清空
              </button>
            </div>
          </div>

          <div className="log-console__shortcut">快捷方式：连续按三下 Enter，可打开或关闭日志台。右下角拖拽可调整窗口大小。</div>

          <div className="log-console__list">
            {filteredEntries.length === 0 ? (
              <div className="log-console__empty">当前筛选条件下没有日志。</div>
            ) : (
              filteredEntries.map((entry) => (
                <article className={`log-entry log-entry--${entry.level}`} key={entry.id}>
                  <div className="log-entry__meta">
                    <span className={`log-entry__pill log-entry__pill--${entry.level}`}>{getLevelLabel(entry.level)}</span>
                    <span className="log-entry__pill log-entry__pill--neutral">{getCategoryLabel(entry.category)}</span>
                    <span className="log-entry__time">{formatTime(entry.timestamp)}</span>
                    <span className="log-entry__action">{entry.action}</span>
                    {entry.status ? <span className="log-entry__status">status {entry.status}</span> : null}
                    {entry.durationMs ? <span className="log-entry__status">{entry.durationMs}ms</span> : null}
                  </div>

                  <p className="log-entry__message">{entry.message}</p>

                  {entry.context ? (
                    <details className="log-entry__details">
                      <summary>查看上下文</summary>
                      <pre>{JSON.stringify(entry.context, null, 2)}</pre>
                    </details>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </aside>
      ) : null}
    </>
  )
}
