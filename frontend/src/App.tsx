/** 负责根据登录态和页面模式切换论坛、认证、发帖和个人中心视图。 */
import { useEffect, useState } from 'react'
import {
  AuthCard,
  useAuthController,
} from './features/auth'
import {
  ForumHome,
  PostComposerPage,
  PostDetailPage,
  composerTopicOptions,
  feedPageSize,
  forumDefaults,
  getPostTypeByTopic,
  getSortValue,
  mapPostItem,
  topicLabels,
  topicOptions,
  type PostFeedItem,
} from './features/post'
import { Toast, type ToastState } from './components/Toast'
import { appLogger, useBrowserLogBridge } from './lib/logger'
import { ProfilePage } from './features/user'
import { VoicePage } from './pages/VoicePage'

type PageMode = 'forum-guest' | 'forum-member' | 'voice' | 'auth' | 'compose' | 'detail' | 'profile'

/**
 * @description 管理前端单页应用的主流程状态，并把各业务页面串成完整体验。
 * @returns 当前页面模式对应的 React 页面结构。
 */
export default function App() {
  useBrowserLogBridge()

  const [toast, setToast] = useState<ToastState | null>(null)
  const auth = useAuthController({
    onLoginSuccess: () => setPageMode('forum-member'),
    onToastChange: setToast,
  })
  const [pageMode, setPageMode] = useState<PageMode>(() => (auth.bootAuth?.accessToken ? 'forum-member' : 'forum-guest'))
  // 通过自增信号驱动帖子页刷新，避免在多个页面之间直接共享复杂列表状态。
  const [forumReloadSignal, setForumReloadSignal] = useState(0)
  const [detailSourcePost, setDetailSourcePost] = useState<PostFeedItem | null>(null)
  // 详情页返回时需要回到进入前的论坛视图，而不是一律跳回登录态页面。
  const [detailReturnMode, setDetailReturnMode] = useState<'forum-guest' | 'forum-member'>('forum-member')

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
    appLogger.log({
      level: 'info',
      category: 'ui',
      action: 'page_mode_change',
      message: '页面模式发生变化',
      context: { pageMode },
    })
  }, [pageMode])

  function handleLogout() {
    auth.logout()
    setPageMode('forum-guest')
  }

  function handlePostCreated() {
    setForumReloadSignal((value) => value + 1)
    setPageMode('forum-member')
  }

  function handleOpenForumPage() {
    setPageMode(auth.accessToken ? 'forum-member' : 'forum-guest')
  }

  /**
   * @description 记录详情页来源帖子和返回目标，保证从不同入口进入时都能正确回跳。
   * @param post PostFeedItem（帖子卡片视图数据），当前点击的帖子摘要。
   * @param returnMode 'forum-guest' | 'forum-member'，详情页返回时应恢复的论坛视图。
   * @returns void
   */
  function handleOpenDetailPage(post: PostFeedItem, returnMode: 'forum-guest' | 'forum-member') {
    setDetailSourcePost(post)
    setDetailReturnMode(returnMode)
    setPageMode('detail')
  }

  if (pageMode === 'forum-guest') {
    return (
      <>
        <Toast toast={toast} />
        <ForumHome
          mode="guest"
          currentProfile={auth.currentProfile}
          onLogout={handleLogout}
          onOpenAuth={() => setPageMode('auth')}
          onOpenComposer={() => setPageMode('compose')}
          onOpenDetail={(post) => handleOpenDetailPage(post, 'forum-guest')}
          onOpenVoice={() => setPageMode('voice')}
          onOpenProfile={() => setPageMode('profile')}
          onToast={setToast}
          feedPageSize={feedPageSize}
          forumDefaults={forumDefaults}
          getPostTypeByTopic={getPostTypeByTopic}
          getSortValue={getSortValue}
          mapPostItem={mapPostItem}
          reloadSignal={forumReloadSignal}
          topicLabels={topicLabels}
          topicOptions={topicOptions}
        />
      </>
    )
  }

  if (pageMode === 'forum-member') {
    return (
      <>
        <Toast toast={toast} />
        <ForumHome
          mode="member"
          currentProfile={auth.currentProfile}
          onLogout={handleLogout}
          onOpenAuth={() => setPageMode('auth')}
          onOpenComposer={() => setPageMode('compose')}
          onOpenDetail={(post) => handleOpenDetailPage(post, 'forum-member')}
          onOpenVoice={() => setPageMode('voice')}
          onOpenProfile={() => setPageMode('profile')}
          onToast={setToast}
          feedPageSize={feedPageSize}
          forumDefaults={forumDefaults}
          getPostTypeByTopic={getPostTypeByTopic}
          getSortValue={getSortValue}
          mapPostItem={mapPostItem}
          reloadSignal={forumReloadSignal}
          topicLabels={topicLabels}
          topicOptions={topicOptions}
        />
      </>
    )
  }

  if (pageMode === 'voice') {
    return (
      <>
        <Toast toast={toast} />
        <VoicePage onOpenPosts={handleOpenForumPage} onToast={setToast} />
      </>
    )
  }

  if (pageMode === 'compose') {
    return (
      <>
        <Toast toast={toast} />
        <PostComposerPage
          accessToken={auth.accessToken}
          getPostTypeByTopic={getPostTypeByTopic}
          onBack={() => setPageMode('forum-member')}
          onCreated={handlePostCreated}
          onRequireAuth={() => setPageMode('auth')}
          onToast={setToast}
          topicOptions={composerTopicOptions}
        />
      </>
    )
  }

  if (pageMode === 'profile') {
    return (
      <>
        <Toast toast={toast} />
        <ProfilePage
          account={auth.account}
          onBack={() => setPageMode('forum-member')}
          onProfileSaved={(profile) => {
            auth.setCurrentProfile(profile)
            setForumReloadSignal((value) => value + 1)
            setPageMode('forum-member')
          }}
          onToast={setToast}
          profile={auth.currentProfile}
        />
      </>
    )
  }

  if (pageMode === 'detail' && detailSourcePost) {
    return (
      <>
        <Toast toast={toast} />
        <PostDetailPage
          accessToken={auth.accessToken}
          currentProfile={auth.currentProfile}
          onBack={() => setPageMode(detailReturnMode)}
          onPostMutated={() => setForumReloadSignal((value) => value + 1)}
          onRequireAuth={() => setPageMode('auth')}
          onToast={setToast}
          sourcePost={detailSourcePost}
          topicLabel={detailSourcePost.topic ? topicLabels[detailSourcePost.topic] : '帖子'}
        />
      </>
    )
  }

  return (
    <>
      <Toast toast={toast} />
      <AuthCard
        account={auth.account}
        accountInputRef={auth.accountInputRef}
        agree={auth.agree}
        agreementInputRef={auth.agreementInputRef}
        authError={auth.authError}
        authStatusId={auth.authStatusId}
        copy={auth.copy}
        mode={auth.mode}
        onAccountChange={auth.handleAccountChange}
        onAgreeChange={auth.handleAgreeChange}
        onModeChange={auth.handleModeChange}
        onOpenHome={() => setPageMode('forum-guest')}
        onPasswordChange={auth.handlePasswordChange}
        onSubmit={auth.handleSubmit}
        password={auth.password}
        passwordInputRef={auth.passwordInputRef}
        submitting={auth.submitting}
        transitionStage={auth.transitionStage}
      />
    </>
  )
}
