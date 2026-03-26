import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { login, register } from './api/auth'
import { createPost, fetchPostList } from './api/post'
import { LogPanel } from './components/LogPanel'
import { Toast, type ToastState } from './components/Toast'
import { appLogger, useBrowserLogBridge } from './lib/logger'
import type { PostListItemDTO } from './types/api'

type AuthMode = 'login' | 'register'
type PageMode = 'forum-guest' | 'forum-member' | 'auth'
type Topic = 'all' | 'tech' | 'life' | 'chat'
type SortMode = 'latest' | 'hot'

interface CopyContent {
  heroTitle: string
  formTitle: string
  formSubtitle: string
  hint: string
  button: string
  footPrefix: string
  footAction: string
}

interface PostStat {
  likes: string
  comments: string
  views: string
  favorites: string
}

interface PostItem {
  id: number
  author: string
  time: string
  topic: Exclude<Topic, 'all'> | null
  title: string
  excerpt: string
  avatar: string
  stats: PostStat
}

const contentMap: Record<AuthMode, CopyContent> = {
  login: {
    heroTitle: '先登录，再进入你的工作空间。',
    formTitle: '欢迎回来',
    formSubtitle: '使用你的 mono 账号登录',
    hint: '登录成功后会直接进入帖子页，并带上 access token 继续联调受保护接口。',
    button: '登录',
    footPrefix: '还没有账号？',
    footAction: '立即注册',
  },
  register: {
    heroTitle: '创建账号，进入 mono 的受保护体验。',
    formTitle: '创建你的账号',
    formSubtitle: '仅需几步，即可进入登录后的工作页面',
    hint: '注册成功后保留在当前页，便于你继续验证登录接口是否正常。',
    button: '创建账号',
    footPrefix: '已经有账号？',
    footAction: '去登录',
  },
}

const topicOptions: Array<{ key: Topic; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'tech', label: '技术' },
  { key: 'life', label: '生活' },
  { key: 'chat', label: '灌水' },
]

const topicLabels: Record<Exclude<Topic, 'all'>, string> = {
  tech: '技术',
  life: '生活',
  chat: '灌水',
}

const forumDefaults: Record<'guest' | 'member', { topic: Topic; sort: SortMode }> = {
  guest: {
    topic: 'all',
    sort: 'latest',
  },
  member: {
    topic: 'tech',
    sort: 'hot',
  },
}

const avatarFallbacks = ['#CBD5E1', '#BFDBFE', '#DDD6FE', '#FDE68A', '#FBCFE8', '#A7F3D0']

function validate(mode: AuthMode, account: string, password: string) {
  const cleanedAccount = account.trim()
  const cleanedPassword = password.trim()

  if (!cleanedAccount) {
    return '请输入账号'
  }

  if (!cleanedPassword) {
    return '请输入密码'
  }

  if (mode === 'register' && cleanedPassword.length < 8) {
    return '注册密码至少需要 8 位字符'
  }

  return ''
}

function formatCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  }
  return String(value)
}

function formatRelativeTime(unixSeconds: number) {
  if (!unixSeconds) {
    return '刚刚'
  }

  const diff = Date.now() - unixSeconds * 1000
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  }
  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))} 分钟前`
  }
  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))} 小时前`
  }
  if (diff < 7 * day) {
    return `${Math.max(1, Math.floor(diff / day))} 天前`
  }

  return new Date(unixSeconds * 1000).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  })
}

function getPostTypeByTopic(topic: Topic) {
  if (topic === 'tech') {
    return 1
  }
  if (topic === 'life') {
    return 2
  }
  if (topic === 'chat') {
    return 3
  }
  return 0
}

function getSortValue(sortMode: SortMode) {
  if (sortMode === 'hot') {
    return 1
  }
  return 2
}

function buildAvatarStyle(avatar: string, seed: number): CSSProperties {
  const fallback = avatarFallbacks[Math.abs(seed) % avatarFallbacks.length]

  if (!avatar) {
    return { background: fallback }
  }

  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return {
      backgroundColor: fallback,
      backgroundImage: `url("${avatar}")`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    }
  }

  return { background: avatar }
}

function mapPostItem(item: PostListItemDTO, topic: Topic): PostItem {
  return {
    id: item.post_id,
    author: item.nickname || `用户 ${item.uid}`,
    time: formatRelativeTime(item.created_at),
    topic: topic === 'all' ? null : topic,
    title: item.title,
    excerpt: item.summary || '这篇帖子还没有摘要。',
    avatar: item.avatar,
    stats: {
      likes: formatCount(item.like_count),
      comments: formatCount(item.comment_count),
      views: formatCount(item.view_count),
      favorites: formatCount(item.collect_count),
    },
  }
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="forum-icon forum-icon--muted" viewBox="0 0 24 24">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 5.303-2.197L21 21"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="forum-icon forum-icon--brand" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="forum-icon forum-icon--soft" viewBox="0 0 24 24">
      <path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function StatIcon({ type }: { type: 'like' | 'comment' | 'view' | 'favorite' }) {
  if (type === 'like') {
    return (
      <svg aria-hidden="true" className="forum-icon forum-icon--tiny" viewBox="0 0 24 24">
        <path
          d="M7 10v10M7 20H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3m0 9V10m0 10h8.68a2 2 0 0 0 1.98-1.75l.97-7A2 2 0 0 0 16.65 9H13V5.5A2.5 2.5 0 0 0 10.5 3L7 10Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    )
  }

  if (type === 'comment') {
    return (
      <svg aria-hidden="true" className="forum-icon forum-icon--tiny" viewBox="0 0 24 24">
        <path
          d="M7 18.5c-2.2 0-4-1.57-4-3.5v-6c0-1.93 1.8-3.5 4-3.5h10c2.2 0 4 1.57 4 3.5v6c0 1.93-1.8 3.5-4 3.5H9l-4 3v-3H7Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    )
  }

  if (type === 'view') {
    return (
      <svg aria-hidden="true" className="forum-icon forum-icon--tiny" viewBox="0 0 24 24">
        <path
          d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="12" fill="none" r="2.8" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="forum-icon forum-icon--tiny" viewBox="0 0 24 24">
      <path
        d="m12 3 2.76 5.6 6.18.9-4.47 4.36 1.06 6.14L12 17.1 6.47 20l1.06-6.14L3.06 9.5l6.18-.9L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function ForumHome({
  mode,
  accessToken,
  onOpenAuth,
  onLogout,
  onToast,
}: {
  mode: 'guest' | 'member'
  accessToken: string | null
  onOpenAuth: (next: PageMode) => void
  onLogout: () => void
  onToast: (toast: ToastState) => void
}) {
  const [topic, setTopic] = useState<Topic>(forumDefaults[mode].topic)
  const [sortMode, setSortMode] = useState<SortMode>(forumDefaults[mode].sort)
  const [menuOpen, setMenuOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [posts, setPosts] = useState<PostItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadSeed, setReloadSeed] = useState(0)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftTopic, setDraftTopic] = useState<Exclude<Topic, 'all'>>('tech')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setTopic(forumDefaults[mode].topic)
    setSortMode(forumDefaults[mode].sort)
    setMenuOpen(false)
    setComposerOpen(false)
    setKeyword('')
    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'forum_mode_ready',
      message: `论坛页已切到 ${mode === 'member' ? '登录态' : '游客态'} 视图`,
      context: { mode },
    })
  }, [mode])

  useEffect(() => {
    if (!keyword.trim()) {
      return
    }

    const timer = window.setTimeout(() => {
      appLogger.log({
        level: 'info',
        category: 'ui',
        action: 'post_search',
        message: '更新帖子搜索关键字',
        context: { keyword },
      })
    }, 450)

    return () => window.clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    let canceled = false

    async function loadPosts() {
      setLoading(true)
      setLoadError('')

      try {
        const resp = await fetchPostList({
          page: 1,
          pageSize: 10,
          postType: getPostTypeByTopic(topic),
          sort: getSortValue(sortMode),
        })

        if (canceled) {
          return
        }

        setPosts((resp.posts ?? []).map((item) => mapPostItem(item, topic)))
        setTotal(resp.total ?? 0)
      } catch (error) {
        if (canceled) {
          return
        }

        setPosts([])
        setTotal(0)
        setLoadError(error instanceof Error ? error.message : '帖子加载失败')
      } finally {
        if (!canceled) {
          setLoading(false)
        }
      }
    }

    loadPosts()

    return () => {
      canceled = true
    }
  }, [topic, sortMode, reloadSeed])

  const visiblePosts = useMemo(() => {
    const search = keyword.trim().toLowerCase()
    if (!search) {
      return posts
    }

    return posts.filter((post) => {
      return post.title.toLowerCase().includes(search) || post.excerpt.toLowerCase().includes(search)
    })
  }, [keyword, posts])

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      appLogger.log({
        level: 'warn',
        category: 'post',
        action: 'create_requires_login',
        message: '当前未登录，发帖前需要先完成登录',
      })
      onToast({ type: 'error', message: '当前没有登录态，请先登录后再发帖。' })
      onOpenAuth('auth')
      return
    }

    if (!draftTitle.trim()) {
      appLogger.log({
        level: 'warn',
        category: 'post',
        action: 'create_validation_failed',
        message: '发帖校验失败：标题为空',
      })
      onToast({ type: 'error', message: '请输入帖子标题。' })
      return
    }

    if (!draftContent.trim()) {
      appLogger.log({
        level: 'warn',
        category: 'post',
        action: 'create_validation_failed',
        message: '发帖校验失败：内容为空',
      })
      onToast({ type: 'error', message: '请输入帖子内容。' })
      return
    }

    setCreating(true)
    appLogger.log({
      level: 'info',
      category: 'post',
      action: 'create_submit',
      message: '提交发帖请求',
      context: {
        title: draftTitle.trim(),
        topic: draftTopic,
        contentLength: draftContent.trim().length,
      },
    })

    try {
      await createPost(
        {
          title: draftTitle.trim(),
          content: draftContent.trim(),
          post_type: getPostTypeByTopic(draftTopic),
        },
        accessToken,
      )

      setDraftTitle('')
      setDraftContent('')
      setDraftTopic('tech')
      setComposerOpen(false)
      setReloadSeed((seed) => seed + 1)
      appLogger.log({
        level: 'success',
        category: 'post',
        action: 'create_success',
        message: '发帖成功',
        context: { topic: draftTopic, title: draftTitle.trim() },
      })
      onToast({ type: 'success', message: '发帖成功，列表已刷新。' })
    } catch (error) {
      appLogger.log({
        level: 'error',
        category: 'post',
        action: 'create_failed',
        message: '发帖失败',
        context: error,
      })
      onToast({
        type: 'error',
        message: error instanceof Error ? error.message : '发帖失败，请稍后再试',
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={`forum-page forum-page--${mode}`}>
      <div className="forum-shell">
        <header className="forum-topbar">
          <div className="forum-brand" aria-label="mono forum">
            <span className="forum-brand__dot" />
            <span className="forum-brand__text">mono</span>
          </div>

          <label className="forum-search" aria-label="搜索帖子">
            <SearchIcon />
            <input
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索帖子标题或摘要..."
              type="text"
              value={keyword}
            />
          </label>

          {mode === 'guest' ? (
            <div className="forum-auth-actions">
              <button className="forum-nav-link" onClick={() => onOpenAuth('auth')} type="button">
                登录
              </button>
              <button
                className="forum-pill-button forum-pill-button--ghost"
                onClick={() => onOpenAuth('auth')}
                type="button"
              >
                注册
              </button>
            </div>
          ) : (
            <div className="forum-member-actions">
              <button className="forum-pill-button" onClick={() => setComposerOpen((open) => !open)} type="button">
                <PlusIcon />
                <span>{composerOpen ? '收起发帖' : '发帖'}</span>
              </button>

              <div className="forum-member-menu">
                <button
                  aria-expanded={menuOpen}
                  className="forum-member-menu__trigger"
                  onClick={() => setMenuOpen((open) => !open)}
                  type="button"
                >
                  <span className="forum-member-menu__avatar" />
                  <ChevronDownIcon />
                </button>

                {menuOpen ? (
                  <div className="forum-member-menu__panel">
                    <button className="forum-menu-item" onClick={() => setReloadSeed((seed) => seed + 1)} type="button">
                      刷新帖子
                    </button>
                    <button className="forum-menu-item" onClick={() => setComposerOpen(true)} type="button">
                      新建帖子
                    </button>
                    <button
                      className="forum-menu-item forum-menu-item--danger"
                      onClick={onLogout}
                      type="button"
                    >
                      退出登录
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </header>

        <main className="forum-content-wrap">
          <section className="forum-feed-panel">
            {mode === 'member' && composerOpen ? (
              <form className="forum-composer" onSubmit={handleCreatePost}>
                <div className="forum-composer__heading">
                  <h3>发布新帖</h3>
                  <p>当前走真实后端接口，创建成功后会刷新当前列表。</p>
                </div>

                <div className="forum-composer__row">
                  <input
                    className="forum-composer__input"
                    disabled={creating}
                    maxLength={100}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="输入帖子标题"
                    value={draftTitle}
                  />

                  <select
                    className="forum-composer__select"
                    disabled={creating}
                    onChange={(event) => setDraftTopic(event.target.value as Exclude<Topic, 'all'>)}
                    value={draftTopic}
                  >
                    <option value="tech">技术</option>
                    <option value="life">生活</option>
                    <option value="chat">灌水</option>
                  </select>
                </div>

                <textarea
                  className="forum-composer__textarea"
                  disabled={creating}
                  maxLength={1000}
                  onChange={(event) => setDraftContent(event.target.value)}
                  placeholder="写点内容，验证 create 接口..."
                  value={draftContent}
                />

                <div className="forum-composer__actions">
                  <span>{draftContent.trim().length}/1000</span>
                  <button className="forum-pill-button" disabled={creating} type="submit">
                    {creating ? '发布中...' : '确认发布'}
                  </button>
                </div>
              </form>
            ) : null}

            <div className="forum-tabs" role="tablist" aria-label="帖子分类">
              {topicOptions.map((item) => {
                const active = item.key === topic
                return (
                  <button
                    aria-selected={active}
                    className={active ? 'forum-tab is-active' : 'forum-tab'}
                    key={item.key}
                    onClick={() => {
                      setTopic(item.key)
                      appLogger.log({
                        level: 'info',
                        category: 'ui',
                        action: 'topic_change',
                        message: '切换帖子分类',
                        context: { topic: item.key },
                      })
                    }}
                    role="tab"
                    type="button"
                  >
                    <span>{item.label}</span>
                    {active ? <span className="forum-tab__bar" /> : null}
                  </button>
                )
              })}
            </div>

            <div className="forum-filters">
              <div className="forum-filters__group" aria-label="排序切换">
                <button
                  className={sortMode === 'latest' ? 'forum-filter is-active' : 'forum-filter'}
                  onClick={() => {
                    setSortMode('latest')
                    appLogger.log({
                      level: 'info',
                      category: 'ui',
                      action: 'sort_change',
                      message: '切换帖子排序为最新',
                    })
                  }}
                  type="button"
                >
                  最新
                </button>
                <button
                  className={sortMode === 'hot' ? 'forum-filter is-active' : 'forum-filter'}
                  onClick={() => {
                    setSortMode('hot')
                    appLogger.log({
                      level: 'info',
                      category: 'ui',
                      action: 'sort_change',
                      message: '切换帖子排序为最热',
                    })
                  }}
                  type="button"
                >
                  最热
                </button>
              </div>
            </div>

            <div className="forum-post-list">
              {loading ? <div className="forum-state-panel">正在加载帖子列表...</div> : null}

              {!loading && loadError ? (
                <div className="forum-state-panel forum-state-panel--error">
                  <p>{loadError}</p>
                  <button className="forum-pill-button forum-pill-button--ghost" onClick={() => setReloadSeed((seed) => seed + 1)} type="button">
                    重试
                  </button>
                </div>
              ) : null}

              {!loading && !loadError && visiblePosts.length === 0 ? (
                <div className="forum-state-panel">
                  {keyword.trim() ? '没有匹配的帖子。' : '当前分类下还没有帖子。'}
                </div>
              ) : null}

              {!loading && !loadError
                ? visiblePosts.map((post) => (
                    <article className="forum-post-card" key={post.id}>
                      <div className="forum-post-card__meta">
                        <div className="forum-author">
                          <span className="forum-author__avatar" style={buildAvatarStyle(post.avatar, post.id)} />
                          <div className="forum-author__info">
                            <span className="forum-author__name">{post.author}</span>
                            <span className="forum-author__time">{post.time}</span>
                          </div>
                        </div>

                        {post.topic ? (
                          <span className={`forum-topic-badge forum-topic-badge--${post.topic}`}>{topicLabels[post.topic]}</span>
                        ) : null}
                      </div>

                      <h2 className="forum-post-card__title">{post.title}</h2>
                      <p className="forum-post-card__excerpt">{post.excerpt}</p>

                      <div className="forum-stats-row">
                        <div className="forum-stat-item">
                          <StatIcon type="like" />
                          <span>{post.stats.likes}</span>
                        </div>
                        <div className="forum-stat-item">
                          <StatIcon type="comment" />
                          <span>{post.stats.comments}</span>
                        </div>
                        <div className="forum-stat-item">
                          <StatIcon type="view" />
                          <span>{post.stats.views}</span>
                        </div>
                        <div className="forum-stat-item">
                          <StatIcon type="favorite" />
                          <span>{post.stats.favorites}</span>
                        </div>
                      </div>
                    </article>
                  ))
                : null}

              {!loading && !loadError ? (
                <div className="forum-load-more">{keyword.trim() ? `筛选后 ${visiblePosts.length} 篇` : `当前共 ${total} 篇`}</div>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  useBrowserLogBridge()

  const [pageMode, setPageMode] = useState<PageMode>('forum-guest')
  const [mode, setMode] = useState<AuthMode>('login')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [transitionStage, setTransitionStage] = useState<'idle' | 'leaving' | 'entering'>('idle')
  const switchTimerRef = useRef<number | null>(null)
  const enterTimerRef = useRef<number | null>(null)

  const copy = useMemo(() => contentMap[mode], [mode])

  useEffect(() => {
    appLogger.log({
      level: 'info',
      category: 'system',
      action: 'app_boot',
      message: '前端应用已启动',
    })
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    return () => {
      if (switchTimerRef.current) {
        window.clearTimeout(switchTimerRef.current)
      }

      if (enterTimerRef.current) {
        window.clearTimeout(enterTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'page_mode_change',
      message: '页面模式发生变化',
      context: { pageMode },
    })
  }, [pageMode])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = validate(mode, account, password)
    if (message) {
      appLogger.log({
        level: 'warn',
        category: 'auth',
        action: 'auth_validation_failed',
        message,
        context: { mode, account: account.trim() },
      })
      setToast({ type: 'error', message })
      return
    }

    if (mode === 'register' && !agree) {
      appLogger.log({
        level: 'warn',
        category: 'auth',
        action: 'register_agreement_required',
        message: '注册被拦截，用户未勾选服务条款',
      })
      setToast({ type: 'error', message: '请先确认服务条款与隐私说明' })
      return
    }

    setSubmitting(true)
    appLogger.log({
      level: 'info',
      category: 'auth',
      action: mode === 'login' ? 'login_submit' : 'register_submit',
      message: mode === 'login' ? '提交登录请求' : '提交注册请求',
      context: { account: account.trim() },
    })

    try {
      if (mode === 'login') {
        const token = await login({
          account: account.trim(),
          password,
        })

        setAccessToken(token)
        appLogger.log({
          level: 'success',
          category: 'auth',
          action: 'login_success',
          message: '登录成功并已写入 access token',
          context: { account: account.trim() },
        })
        setToast({ type: 'success', message: '登录成功，已切到真实帖子列表。' })
        setPageMode('forum-member')
      } else {
        await register({
          account: account.trim(),
          password,
        })

        appLogger.log({
          level: 'success',
          category: 'auth',
          action: 'register_success',
          message: '注册成功',
          context: { account: account.trim() },
        })
        setToast({ type: 'success', message: '注册成功，现在可以直接登录验证。' })
        setMode('login')
      }
    } catch (error) {
      appLogger.log({
        level: 'error',
        category: 'auth',
        action: mode === 'login' ? 'login_failed' : 'register_failed',
        message: mode === 'login' ? '登录失败' : '注册失败',
        context: error,
      })
      const message = error instanceof Error ? error.message : '请求失败，请稍后再试'
      setToast({ type: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  function handleModeChange(nextMode: AuthMode) {
    if (nextMode === mode || transitionStage === 'leaving') {
      return
    }

    setToast(null)
    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'auth_mode_change',
      message: '切换认证模式',
      context: { from: mode, to: nextMode },
    })
    setTransitionStage('leaving')

    if (switchTimerRef.current) {
      window.clearTimeout(switchTimerRef.current)
    }

    if (enterTimerRef.current) {
      window.clearTimeout(enterTimerRef.current)
    }

    switchTimerRef.current = window.setTimeout(() => {
      setMode(nextMode)
      setTransitionStage('entering')

      enterTimerRef.current = window.setTimeout(() => {
        setTransitionStage('idle')
      }, 260)
    }, 170)
  }

  function handleLogout() {
    setAccessToken(null)
    setPageMode('forum-guest')
    appLogger.log({
      level: 'info',
      category: 'auth',
      action: 'logout',
      message: '用户主动退出登录',
    })
    setToast({ type: 'success', message: '已退出登录。' })
  }

  if (pageMode === 'forum-guest') {
    return (
      <>
        <Toast toast={toast} />
        <ForumHome accessToken={accessToken} mode="guest" onLogout={handleLogout} onOpenAuth={setPageMode} onToast={setToast} />
        <LogPanel />
      </>
    )
  }

  if (pageMode === 'forum-member') {
    return (
      <>
        <Toast toast={toast} />
        <ForumHome accessToken={accessToken} mode="member" onLogout={handleLogout} onOpenAuth={setPageMode} onToast={setToast} />
        <LogPanel />
      </>
    )
  }

  return (
    <div className={`app app--${mode}`}>
      <Toast toast={toast} />
      <LogPanel />
      <header className="topbar">
        <button className="brand brand--home" onClick={() => setPageMode('forum-guest')} type="button">
          mono
        </button>
        <div className="mode-switch" aria-label="认证模式切换">
          <button
            className={mode === 'login' ? 'mode-switch__item is-active' : 'mode-switch__item'}
            onClick={() => handleModeChange('login')}
            type="button"
          >
            登录
          </button>
          <button
            className={mode === 'register' ? 'mode-switch__item is-active' : 'mode-switch__item'}
            onClick={() => handleModeChange('register')}
            type="button"
          >
            注册
          </button>
        </div>
      </header>

      <main className="hero">
        <section className={`hero__intro auth-stage auth-stage--${transitionStage}`}>
          <h1>{copy.heroTitle}</h1>
          <div className="hero__logo" aria-label="mono brand logo">
            <span className="hero__logoMark" />
            <span className="hero__logoText">mono</span>
          </div>
        </section>

        <section className={`hero__panel auth-stage auth-stage--${transitionStage}`}>
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="auth-card__heading">
              <h2>{copy.formTitle}</h2>
              <p>{copy.formSubtitle}</p>
            </div>

            <label className="field">
              <span className="field__label">账号</span>
              <input
                autoComplete="username"
                className="field__control"
                name="account"
                onChange={(event) => setAccount(event.target.value)}
                placeholder={mode === 'login' ? '请输入 account' : '设置你的 account'}
                value={account}
              />
            </label>

            <label className="field">
              <span className="field__label">密码</span>
              <input
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="field__control"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'login' ? '请输入密码' : '至少 8 位字符'}
                type="password"
                value={password}
              />
            </label>

            {mode === 'login' ? (
              <div className="meta-row">
                <span>登录成功后会进入真实帖子页</span>
                <span className="meta-row__link">当前不在页面层读取 refresh token</span>
              </div>
            ) : (
              <label className="agreement">
                <input
                  checked={agree}
                  onChange={(event) => setAgree(event.target.checked)}
                  type="checkbox"
                />
                <span>我已阅读并同意服务条款与隐私说明</span>
              </label>
            )}

            <button className="submit-button" disabled={submitting} type="submit">
              {submitting ? '提交中...' : copy.button}
            </button>

            <div className="foot-switch">
              <span>{copy.footPrefix}</span>
              <button
                className="foot-switch__action"
                onClick={() => handleModeChange(mode === 'login' ? 'register' : 'login')}
                type="button"
              >
                {copy.footAction}
              </button>
            </div>

            <div className="auth-tip">
              <p>{copy.hint}</p>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
