import { useEffect, useMemo, useRef, useState } from 'react'
import { login, register } from './api/auth'
import { Toast, type ToastState } from './components/Toast'

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
  topic: Exclude<Topic, 'all'>
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
    hint: '登录成功后会先给出成功提示，页面跳转在后续业务开发阶段再接入。',
    button: '登录',
    footPrefix: '还没有账号？',
    footAction: '立即注册',
  },
  register: {
    heroTitle: '创建账号，进入 mono 的受保护体验。',
    formTitle: '创建你的账号',
    formSubtitle: '仅需几步，即可进入登录后的工作页面',
    hint: '注册成功后只弹提示，不立即跳转，便于后续按真实业务再接页面流转。',
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

const feedMap: Record<'guest' | 'member', { defaultTopic: Topic; defaultSort: SortMode; posts: PostItem[] }> = {
  guest: {
    defaultTopic: 'all',
    defaultSort: 'latest',
    posts: [
      {
        id: 1,
        author: '阿泽',
        time: '3 小时前',
        topic: 'tech',
        title: 'Go 服务里 context 该传到哪一层才合适？',
        excerpt:
          '最近在整理项目分层，handler、service、repo 都在传 context。想请教一下，哪些场景必须往下透传，哪些地方传了反而让代码变得别扭？',
        avatar: '#CBD5E1',
        stats: { likes: '128', comments: '34', views: '1.2k', favorites: '56' },
      },
      {
        id: 2,
        author: 'Lin',
        time: '5 小时前',
        topic: 'life',
        title: '你们现在还会坚持写周报吗？',
        excerpt:
          '团队从 8 个人扩到 20 个人后，我发现异步信息越来越碎。周报虽然土，但好像还是最省沟通成本的方式。',
        avatar: '#BFDBFE',
        stats: { likes: '87', comments: '19', views: '680', favorites: '21' },
      },
      {
        id: 3,
        author: '大刘',
        time: '昨天',
        topic: 'chat',
        title: '分享一个最近很有用的终端小工具',
        excerpt:
          '它不是那种功能堆满的效率软件，只有几个命令，但把我每天重复的日志检索和端口检查都省掉了。',
        avatar: '#DDD6FE',
        stats: { likes: '204', comments: '42', views: '2.4k', favorites: '73' },
      },
      {
        id: 4,
        author: 'Mika',
        time: '2 天前',
        topic: 'tech',
        title: '为什么我越来越倾向先写最小可运行版本？',
        excerpt:
          '之前做需求总想一步到位，结果返工最多。现在更愿意先把核心链路跑通，再慢慢补体验和边界处理，反而整体更稳。',
        avatar: '#FDE68A',
        stats: { likes: '152', comments: '27', views: '930', favorites: '48' },
      },
      {
        id: 5,
        author: '小棠',
        time: '3 天前',
        topic: 'life',
        title: '第一次带实习生，有什么低成本但有效的方法？',
        excerpt:
          '我不想一上来就把流程搞得很重，但也怕对方没有方向。大家有没有那种真的能落地、不会增加太多管理负担的做法？',
        avatar: '#FBCFE8',
        stats: { likes: '64', comments: '15', views: '510', favorites: '18' },
      },
    ],
  },
  member: {
    defaultTopic: 'tech',
    defaultSort: 'hot',
    posts: [
      {
        id: 6,
        author: '河图',
        time: '刚刚',
        topic: 'tech',
        title: '生产环境里怎么排查偶发性的超时问题？',
        excerpt:
          '接口平均耗时一直正常，但每天会出现几次 3 到 5 秒的抖动。现在准备从日志、链路追踪和数据库慢查询三个方向一起看。',
        avatar: '#BFDBFE',
        stats: { likes: '312', comments: '68', views: '3.8k', favorites: '104' },
      },
      {
        id: 7,
        author: 'Sean',
        time: '28 分钟前',
        topic: 'tech',
        title: '关于 Go 1.25 新特性，大家最关注哪一块？',
        excerpt:
          '我自己最关心的还是性能剖析链路和工具链体验。如果升级成本不高，很多团队今年应该都会逐步跟上。',
        avatar: '#C7D2FE',
        stats: { likes: '196', comments: '53', views: '2.1k', favorites: '66' },
      },
      {
        id: 8,
        author: '阿珍',
        time: '1 小时前',
        topic: 'life',
        title: '远程团队里，大家怎么维持“人在现场”的感觉？',
        excerpt:
          '不是说天天开会，而是那种遇到事情能快速被看见、被接住的协作感。最近我们在试更轻量的日报和异步语音。',
        avatar: '#FDE68A',
        stats: { likes: '143', comments: '31', views: '1.1k', favorites: '29' },
      },
      {
        id: 9,
        author: 'Box',
        time: '2 小时前',
        topic: 'chat',
        title: '最近谁还在坚持写长文档？',
        excerpt:
          '我发现很多讨论在聊天工具里很快就沉了，真正需要复盘的时候，还是一篇结构完整的文档最能救命。',
        avatar: '#FBCFE8',
        stats: { likes: '88', comments: '22', views: '760', favorites: '25' },
      },
      {
        id: 10,
        author: 'Yuna',
        time: '4 小时前',
        topic: 'tech',
        title: '大家的代码评审现在还有人认真写评论吗？',
        excerpt:
          '我们团队最近在反思，很多 Review 只剩“LGTM”。是不是该把关注点重新放回设计意图和风险说明？',
        avatar: '#A7F3D0',
        stats: { likes: '221', comments: '45', views: '1.9k', favorites: '59' },
      },
    ],
  },
}

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
  onOpenAuth,
}: {
  mode: 'guest' | 'member'
  onOpenAuth: (next: PageMode) => void
}) {
  const [topic, setTopic] = useState<Topic>(feedMap[mode].defaultTopic)
  const [sortMode, setSortMode] = useState<SortMode>(feedMap[mode].defaultSort)
  const [menuOpen, setMenuOpen] = useState(false)
  const currentFeed = feedMap[mode]

  useEffect(() => {
    setTopic(currentFeed.defaultTopic)
    setSortMode(currentFeed.defaultSort)
    setMenuOpen(false)
  }, [currentFeed.defaultSort, currentFeed.defaultTopic])

  const visiblePosts = useMemo(() => {
    return currentFeed.posts.filter((post) => topic === 'all' || post.topic === topic)
  }, [currentFeed.posts, topic])

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
            <input defaultValue="" placeholder="搜索帖子..." type="text" />
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
              <button className="forum-pill-button" type="button">
                <PlusIcon />
                <span>发帖</span>
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
                    <button className="forum-menu-item" type="button">
                      个人主页
                    </button>
                    <button className="forum-menu-item" type="button">
                      我的帖子
                    </button>
                    <button className="forum-menu-item forum-menu-item--danger" onClick={() => onOpenAuth('forum-guest')} type="button">
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
            <div className="forum-tabs" role="tablist" aria-label="帖子分类">
              {topicOptions.map((item) => {
                const active = item.key === topic
                return (
                  <button
                    aria-selected={active}
                    className={active ? 'forum-tab is-active' : 'forum-tab'}
                    key={item.key}
                    onClick={() => setTopic(item.key)}
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
                  onClick={() => setSortMode('latest')}
                  type="button"
                >
                  最新
                </button>
                <button
                  className={sortMode === 'hot' ? 'forum-filter is-active' : 'forum-filter'}
                  onClick={() => setSortMode('hot')}
                  type="button"
                >
                  最热
                </button>
              </div>
            </div>

            <div className="forum-post-list">
              {visiblePosts.map((post) => (
                <article className="forum-post-card" key={post.id}>
                  <div className="forum-post-card__meta">
                    <div className="forum-author">
                      <span className="forum-author__avatar" style={{ background: post.avatar }} />
                      <div className="forum-author__info">
                        <span className="forum-author__name">{post.author}</span>
                        <span className="forum-author__time">{post.time}</span>
                      </div>
                    </div>

                    <span className={`forum-topic-badge forum-topic-badge--${post.topic}`}>{topicLabels[post.topic]}</span>
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
              ))}

              <div className="forum-load-more">加载更多...</div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [pageMode, setPageMode] = useState<PageMode>('forum-guest')
  const [mode, setMode] = useState<AuthMode>('login')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [transitionStage, setTransitionStage] = useState<'idle' | 'leaving' | 'entering'>('idle')
  const switchTimerRef = useRef<number | null>(null)
  const enterTimerRef = useRef<number | null>(null)

  const copy = useMemo(() => contentMap[mode], [mode])

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = validate(mode, account, password)
    if (message) {
      setToast({ type: 'error', message })
      return
    }

    if (mode === 'register' && !agree) {
      setToast({ type: 'error', message: '请先确认服务条款与隐私说明' })
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'login') {
        await login({
          account: account.trim(),
          password,
        })

        setToast({ type: 'success', message: '登录成功，接口联调已通过。' })
        setPageMode('forum-member')
      } else {
        await register({
          account: account.trim(),
          password,
        })

        setToast({ type: 'success', message: '注册成功，当前先保留在本页提示。' })
      }
    } catch (error) {
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

  if (pageMode === 'forum-guest') {
    return (
      <>
        <Toast toast={toast} />
        <ForumHome mode="guest" onOpenAuth={setPageMode} />
      </>
    )
  }

  if (pageMode === 'forum-member') {
    return (
      <>
        <Toast toast={toast} />
        <ForumHome mode="member" onOpenAuth={setPageMode} />
      </>
    )
  }

  return (
    <div className={`app app--${mode}`}>
      <Toast toast={toast} />
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
                <span>忘记密码？</span>
                <span className="meta-row__link">需要帮助</span>
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
