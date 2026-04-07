/** 负责提供帖子页与语音页之间的轻量切换标签。 */
interface PageTabsProps {
  activeTab: 'posts' | 'voice'
  onOpenPosts: () => void
  onOpenVoice: () => void
}

/**
 * @description 在顶部品牌区旁边渲染页面切换标签，保持帖子页和语音页的入口一致。
 * @param props PageTabsProps，当前激活标签与切换回调。
 * @returns React 页面切换标签组件。
 */
export function PageTabs({ activeTab, onOpenPosts, onOpenVoice }: PageTabsProps) {
  return (
    <div aria-label="页面切换" className="page-switch" role="tablist">
      <button
        aria-selected={activeTab === 'posts'}
        className={activeTab === 'posts' ? 'page-switch__item is-active' : 'page-switch__item'}
        onClick={onOpenPosts}
        role="tab"
        type="button"
      >
        帖子
      </button>
      <button
        aria-selected={activeTab === 'voice'}
        className={activeTab === 'voice' ? 'page-switch__item is-active' : 'page-switch__item'}
        onClick={onOpenVoice}
        role="tab"
        type="button"
      >
        语音
      </button>
    </div>
  )
}
