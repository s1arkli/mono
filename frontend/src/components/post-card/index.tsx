import "./index.css";
import type { ListItem } from "../../types/api/post";

export default function PostCard(data: ListItem) {
    const createdAtText = new Date(data.createdAt).toLocaleString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <article className="post-card">
            <header className="post-card__header">
                <div className="post-card__author-row">
                    <img className="post-card__avatar" src={data.avatar} alt={`${data.nickname} 的头像`} />
                    <div className="post-card__author-meta">
                        <span className="post-card__author">{data.nickname}</span>
                        {data.isTopped ? <span className="post-card__tag">置顶</span> : null}
                    </div>
                </div>
                <time className="post-card__time">{createdAtText}</time>
            </header>

            <div className="post-card__body">
                <h2 className="post-card__title">{data.title}</h2>
                <p className="post-card__summary">{data.summary}</p>
            </div>

            <footer className="post-card__footer">
                <span className="post-card__stat">{data.commentCount} 评论</span>
                <span className="post-card__stat">{data.likeCount} 点赞</span>
                <span className="post-card__stat">{data.collectCount} 收藏</span>
                <span className="post-card__stat">{data.viewCount} 浏览</span>
            </footer>
        </article>
    );
}
