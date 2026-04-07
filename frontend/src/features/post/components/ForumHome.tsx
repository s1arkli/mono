/** 负责渲染论坛首页，并管理帖子筛选、缓存、搜索和滚动加载。 */
import {
  startTransition,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { fetchPostList, type PostFeedItem, type PostListItemDTO, type PostSortMode, type PostTopic } from '@/features/post'
import type { ToastState } from '@/components/Toast'
import { PageTabs } from '@/components/voice/PageTabs'
import { ChevronDownIcon, PlusIcon, SearchIcon, StatIcon } from '@/features/post/components/PostIcons'
import type { UserProfile } from '@/features/user'
import { isServiceUnavailableError } from '@/lib/http/errors'
import { appLogger } from '@/lib/logger'
import { buildAvatarStyle } from '@/utils/avatar'

interface FeedCacheEntry {
  posts: PostFeedItem[]
  total: number
  page: number
  hasMore: boolean
}

interface ForumHomeProps {
  mode: 'guest' | 'member'
  currentProfile: UserProfile | null
  onOpenAuth: () => void
  onOpenComposer: () => void
  onOpenDetail: (post: PostFeedItem) => void
  onOpenVoice: () => void
  onOpenProfile: () => void
  onLogout: () => void
  onToast: (toast: ToastState) => void
  reloadSignal: number
  topicOptions: Array<{ key: PostTopic; label: string }>
  topicLabels: Record<Exclude<PostTopic, 'all'>, string>
  forumDefaults: Record<'guest' | 'member', { topic: PostTopic; sort: PostSortMode }>
  feedPageSize: number
  getPostTypeByTopic: (topic: PostTopic) => number
  getSortValue: (sortMode: PostSortMode) => number
  mapPostItem: (item: PostListItemDTO, topic: PostTopic) => PostFeedItem
}

/**
 * @description 渲染论坛首页，根据游客态或登录态加载帖子流并提供筛选、搜索、发帖入口。
 * @param props ForumHomeProps，论坛首页需要的状态输入、配置和交互回调。
 * @returns React 论坛首页组件。
 */
export function ForumHome({
  mode,
  currentProfile,
  onOpenAuth,
  onOpenComposer,
  onOpenDetail,
  onOpenVoice,
  onOpenProfile,
  onLogout,
  onToast,
  reloadSignal,
  topicOptions,
  topicLabels,
  forumDefaults,
  feedPageSize,
  getPostTypeByTopic,
  getSortValue,
  mapPostItem,
}: ForumHomeProps) {
  const [topic, setTopic] = useState<PostTopic>(forumDefaults[mode].topic)
  const [sortMode, setSortMode] = useState<PostSortMode>(forumDefaults[mode].sort)
  const [menuOpen, setMenuOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [posts, setPosts] = useState<PostFeedItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  // feedTransitionStage（帖子流切换动画状态）用于分类/排序切换时做出场和入场过渡。
  const [feedTransitionStage, setFeedTransitionStage] = useState<'idle' | 'leaving' | 'entering'>('idle')
  const [loadError, setLoadError] = useState('')
  const [reloadSeed, setReloadSeed] = useState(0)
  const searchId = useId()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const postCacheRef = useRef(new Map<string, FeedCacheEntry>())
  const hasResolvedFeedRef = useRef(false)
  const activeFeedKeyRef = useRef('')
  const feedSwapTimerRef = useRef<number | null>(null)
  const feedEnterTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setTopic(forumDefaults[mode].topic)
    setSortMode(forumDefaults[mode].sort)
    setMenuOpen(false)
    setKeyword('')
    setSearchKeyword('')
    setPage(1)
    setHasMore(false)
    setLoadingMore(false)
    setFeedTransitionStage('idle')
    activeFeedKeyRef.current = ''
    hasResolvedFeedRef.current = false
    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'forum_mode_ready',
      message: `论坛页已切到 ${mode === 'member' ? '登录态' : '游客态'} 视图`,
      context: { mode },
    })
  }, [forumDefaults, mode])

  useEffect(() => {
    return () => {
      if (feedSwapTimerRef.current) {
        window.clearTimeout(feedSwapTimerRef.current)
      }

      if (feedEnterTimerRef.current) {
        window.clearTimeout(feedEnterTimerRef.current)
      }
    }
  }, [])

  function buildCacheKey(nextTopic: PostTopic, nextSortMode: PostSortMode) {
    return `${nextTopic}:${nextSortMode}`
  }

  /**
   * @description 拉取指定页码的帖子数据，并映射成页面消费的缓存结构。
   * @param pageNumber number，当前要加载的页码。
   * @returns Promise<FeedCacheEntry>，可直接写入缓存和列表状态的结果。
   */
  const fetchFeedPage = useCallback(
    async (pageNumber: number) => {
      const resp = await fetchPostList({
        page: pageNumber,
        pageSize: feedPageSize,
        postType: getPostTypeByTopic(topic),
        sort: getSortValue(sortMode),
      })

      const nextPosts = (resp.posts ?? []).map((item) => mapPostItem(item, topic))
      const nextTotal = resp.total ?? 0

      return {
        posts: nextPosts,
        total: nextTotal,
        page: pageNumber,
        hasMore: pageNumber * feedPageSize < nextTotal,
      } satisfies FeedCacheEntry
    },
    [feedPageSize, getPostTypeByTopic, getSortValue, mapPostItem, sortMode, topic],
  )

  useEffect(() => {
    let canceled = false
    const cacheKey = buildCacheKey(topic, sortMode)
    const cachedEntry = postCacheRef.current.get(cacheKey)
    const hasResolvedFeed = hasResolvedFeedRef.current
    const isFeedSwitch = hasResolvedFeed && activeFeedKeyRef.current !== '' && activeFeedKeyRef.current !== cacheKey
    const isManualReload = hasResolvedFeed && activeFeedKeyRef.current === cacheKey

    setLoading(!hasResolvedFeed)
    setRefreshing(hasResolvedFeed)
    setLoadError('')

    if (feedSwapTimerRef.current) {
      window.clearTimeout(feedSwapTimerRef.current)
    }

    if (feedEnterTimerRef.current) {
      window.clearTimeout(feedEnterTimerRef.current)
    }

    if (isFeedSwitch) {
      setFeedTransitionStage('leaving')
    } else if (!hasResolvedFeed) {
      setFeedTransitionStage('idle')
    }

    function commitFeed(entry: FeedCacheEntry) {
      const applyPosts = () => {
        if (canceled) {
          return
        }

        // 帖子列表切换涉及较多节点更新，放进 transition（过渡）里可以减少交互卡顿感。
        startTransition(() => {
          setPosts(entry.posts)
          setTotal(entry.total)
          setPage(entry.page)
          setHasMore(entry.hasMore)
        })
        activeFeedKeyRef.current = cacheKey
        hasResolvedFeedRef.current = true
        setLoading(false)
        setRefreshing(false)

        if (isFeedSwitch) {
          setFeedTransitionStage('entering')
          feedEnterTimerRef.current = window.setTimeout(() => {
            setFeedTransitionStage('idle')
          }, 220)
          return
        }

        setFeedTransitionStage('idle')
      }

      if (isFeedSwitch) {
        feedSwapTimerRef.current = window.setTimeout(applyPosts, 150)
        return
      }

      applyPosts()
    }

    async function loadPosts() {
      try {
        let nextEntry: FeedCacheEntry

        if (cachedEntry && !isManualReload) {
          // 相同筛选条件优先命中缓存，避免用户来回切 tab（标签）时重复请求。
          nextEntry = cachedEntry
        } else {
          nextEntry = await fetchFeedPage(1)
          postCacheRef.current.set(cacheKey, nextEntry)
        }

        if (canceled) {
          return
        }

        commitFeed(nextEntry)
      } catch (error) {
        if (canceled) {
          return
        }

        if (isServiceUnavailableError(error)) {
          setPosts([])
          setTotal(0)
          setPage(1)
          setHasMore(false)
          setLoadError('')
          onToast({ type: 'error', message: error.message })
          return
        }

        if (!cachedEntry && !hasResolvedFeed) {
          setPosts([])
          setTotal(0)
          setPage(1)
          setHasMore(false)
          setLoadError(error instanceof Error ? error.message : '帖子加载失败')
          return
        }

        setLoadError('')
      } finally {
        if (!canceled) {
          if (!isFeedSwitch && !cachedEntry) {
            setLoading(false)
            setRefreshing(false)
          }
        }
      }
    }

    loadPosts()

    return () => {
      canceled = true
    }
  }, [fetchFeedPage, onToast, reloadSeed, reloadSignal, sortMode, topic])

  useEffect(() => {
    if (!hasMore || loading || loadingMore || refreshing || loadError) {
      return
    }

    const target = loadMoreRef.current
    if (!target) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) {
          return
        }

        setLoadingMore(true)
      },
      {
        rootMargin: '240px 0px',
      },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, loadError, loading, loadingMore, posts.length, refreshing, searchKeyword])

  useEffect(() => {
    if (!loadingMore) {
      return
    }

    let canceled = false
    const cacheKey = buildCacheKey(topic, sortMode)

    async function loadNextPage() {
      try {
        const nextEntry = await fetchFeedPage(page + 1)
        if (canceled) {
          return
        }

        const mergedPosts = [...posts]
        for (const item of nextEntry.posts) {
          if (!mergedPosts.some((post) => post.id === item.id)) {
            mergedPosts.push(item)
          }
        }

        const mergedEntry: FeedCacheEntry = {
          posts: mergedPosts,
          total: nextEntry.total,
          page: nextEntry.page,
          hasMore: nextEntry.hasMore,
        }

        // 分页结果也回写缓存，保证切换分类后再切回来时仍能保留用户已经滚到的位置。
        postCacheRef.current.set(cacheKey, mergedEntry)
        startTransition(() => {
          setPosts(mergedEntry.posts)
          setTotal(mergedEntry.total)
          setPage(mergedEntry.page)
          setHasMore(mergedEntry.hasMore)
        })
      } catch (error) {
        if (!canceled) {
          if (isServiceUnavailableError(error)) {
            onToast({ type: 'error', message: error.message })
            return
          }
          appLogger.log({
            level: 'warn',
            category: 'post',
            action: 'list_load_more_failed',
            message: '帖子列表加载更多失败',
            context: error,
          })
        }
      } finally {
        if (!canceled) {
          setLoadingMore(false)
        }
      }
    }

    loadNextPage()

    return () => {
      canceled = true
    }
  }, [fetchFeedPage, loadingMore, onToast, page, posts, sortMode, topic])

  function handleTopicChange(nextTopic: PostTopic) {
    if (nextTopic === topic) {
      return
    }

    startTransition(() => {
      setTopic(nextTopic)
    })
    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'topic_change',
      message: '切换帖子分类',
      context: { topic: nextTopic },
    })
  }

  function handleSortChange(nextSort: PostSortMode) {
    if (nextSort === sortMode) {
      return
    }

    startTransition(() => {
      setSortMode(nextSort)
    })
    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'sort_change',
      message: `切换帖子排序为${nextSort === 'latest' ? '最新' : '最热'}`,
    })
  }

  function handleReloadPosts() {
    startTransition(() => {
      setReloadSeed((seed) => seed + 1)
    })
  }

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    function handleMenuPointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return
      }

      setMenuOpen(false)
    }

    window.addEventListener('pointerdown', handleMenuPointerDown)
    return () => window.removeEventListener('pointerdown', handleMenuPointerDown)
  }, [menuOpen])

  const visiblePosts = useMemo(() => {
    const search = searchKeyword.trim().toLowerCase()
    if (!search) {
      return posts
    }

    // 搜索仅在已加载的帖子里做前端过滤，避免把临时关键字输入放大成额外接口压力。
    return posts.filter((post) => {
      return post.title.toLowerCase().includes(search) || post.excerpt.toLowerCase().includes(search)
    })
  }, [posts, searchKeyword])

  /**
   * @description 提交当前搜索关键字，并记录一次搜索行为日志。
   * @param event FormEvent<HTMLFormElement>，搜索表单提交事件。
   * @returns void
   */
  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextKeyword = keyword.trim()
    setSearchKeyword(nextKeyword)
    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'post_search',
      message: '提交帖子搜索关键字',
      context: { keyword: nextKeyword },
    })
  }

  /**
   * @description 打开帖子详情页，并记录当前点击的帖子上下文。
   * @param post PostFeedItem，用户点击的帖子卡片数据。
   * @returns void
   */
  function handleOpenPostDetail(post: PostFeedItem) {
    appLogger.log({
      level: 'info',
      category: 'post',
      action: 'detail_open',
      message: '打开帖子详情页',
      context: { postId: post.id, uid: post.uid, title: post.title },
    })
    onOpenDetail(post)
  }

  return (
    <div className={`forum-page forum-page--${mode}`}>
      <div className="forum-shell">
        <header className="forum-topbar">
          <div className="forum-topbar__left">
            <div className="forum-brand" aria-label="mono forum">
              <span className="forum-brand__dot" />
              <span className="forum-brand__text">mono</span>
            </div>
            <PageTabs activeTab="posts" onOpenPosts={() => undefined} onOpenVoice={onOpenVoice} />
          </div>

          <form className="forum-search" onSubmit={handleSearchSubmit}>
            <SearchIcon />
            <label className="sr-only" htmlFor={searchId}>
              搜索帖子
            </label>
            <input
              autoComplete="off"
              enterKeyHint="search"
              id={searchId}
              name="post-search"
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索帖子标题或摘要…"
              spellCheck={false}
              type="text"
              value={keyword}
            />
          </form>

          {mode === 'guest' ? (
            <div className="forum-auth-actions">
              <button className="forum-nav-link" onClick={onOpenAuth} type="button">
                登录
              </button>
              <button className="forum-pill-button forum-pill-button--ghost" onClick={onOpenAuth} type="button">
                注册
              </button>
            </div>
          ) : (
            <div className="forum-member-actions">
              <button className="forum-pill-button" onClick={onOpenComposer} type="button">
                <PlusIcon />
                <span>发帖</span>
              </button>

              <div className="forum-member-menu" ref={menuRef}>
                <button
                  aria-controls="forum-member-menu-panel"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label={menuOpen ? '收起用户菜单' : '打开用户菜单'}
                  className="forum-member-menu__trigger"
                  onClick={() => setMenuOpen((open) => !open)}
                  type="button"
                >
                  <span
                    className="forum-member-menu__avatar"
                    style={buildAvatarStyle(currentProfile?.avatar || '', currentProfile?.uid ?? 0)}
                  />
                  <ChevronDownIcon />
                </button>

                {menuOpen ? (
                  <div className="forum-member-menu__panel" id="forum-member-menu-panel" role="menu">
                    <button
                      className="forum-menu-item"
                      onClick={() => {
                        onOpenProfile()
                        setMenuOpen(false)
                      }}
                      role="menuitem"
                      type="button"
                    >
                      个人中心
                    </button>
                    <button
                      className="forum-menu-item forum-menu-item--danger"
                      onClick={() => {
                        setMenuOpen(false)
                        onLogout()
                      }}
                      role="menuitem"
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
            <div className="forum-tabs" role="tablist" aria-label="帖子分类">
              {topicOptions.map((item) => {
                const active = item.key === topic
                return (
                  <button
                    aria-selected={active}
                    className={active ? 'forum-tab is-active' : 'forum-tab'}
                    key={item.key}
                    onClick={() => {
                      handleTopicChange(item.key)
                    }}
                    role="tab"
                    type="button"
                  >
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="forum-filters">
              <div className="forum-filters__group" aria-label="排序切换">
                <button
                  className={sortMode === 'latest' ? 'forum-filter is-active' : 'forum-filter'}
                  onClick={() => handleSortChange('latest')}
                  type="button"
                >
                  最新
                </button>
                <button
                  className={sortMode === 'hot' ? 'forum-filter is-active' : 'forum-filter'}
                  onClick={() => handleSortChange('hot')}
                  type="button"
                >
                  最热
                </button>
              </div>
            </div>

            <div
              className={[
                'forum-post-list',
                refreshing ? 'forum-post-list--refreshing' : '',
                feedTransitionStage === 'leaving' ? 'forum-post-list--leaving' : '',
                feedTransitionStage === 'entering' ? 'forum-post-list--entering' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {loading ? (
                <div className="forum-state-panel" role="status" aria-live="polite">
                  正在加载帖子列表…
                </div>
              ) : null}

              {!loading && loadError ? (
                <div className="forum-state-panel forum-state-panel--error">
                  <p>{loadError}</p>
                  <button className="forum-pill-button forum-pill-button--ghost" onClick={handleReloadPosts} type="button">
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
                    <button
                      className="forum-post-card forum-post-card--interactive"
                      key={post.id}
                      onClick={() => handleOpenPostDetail(post)}
                      type="button"
                    >
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
                    </button>
                  ))
                : null}

              {!loading && !loadError ? (
                <div className="forum-load-more" aria-live="polite">
                  {keyword.trim() && keyword !== searchKeyword
                    ? '按 Enter 搜索'
                    : searchKeyword
                      ? `已加载 ${posts.length}/${total} 篇，筛选后 ${visiblePosts.length} 篇`
                      : loadingMore
                        ? `正在加载更多帖子… 已加载 ${posts.length}/${total} 篇`
                        : hasMore
                          ? `已加载 ${posts.length}/${total} 篇，继续下滑加载更多`
                          : `已加载全部 ${total} 篇`}
                </div>
              ) : null}

              {!loading && !loadError ? <div aria-hidden="true" className="forum-load-more-sentinel" ref={loadMoreRef} /> : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
