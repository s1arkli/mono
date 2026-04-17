import "./index.css";
import PostCard from "../../components/post-card";
import type { ListItem } from "../../types/api/post";
import {useState} from "react";

const posts: ListItem[] = [
    {
        title: "社区首页的信息层级应该怎么整理？",
        summary: "我在整理文字社区首页的卡片层级，想先固定标题、摘要、作者信息和计数信息的顺序。大家一般会怎么安排信息优先级，才能既方便扫读又不显得拥挤？",
        postId: 1001,
        uid: 101,
        avatar: "/default-shark-avatar.svg",
        nickname: "林楠",
        likeCount: 48,
        collectCount: 19,
        commentCount: 12,
        viewCount: 221,
        isTopped: true,
        createdAt: new Date("2026-04-17T09:20:00+08:00").getTime(),
    },
    {
        title: "纯文本帖子流在前端里怎么排版更稳？",
        summary: "最近在做一个偏安静的论坛首页，希望卡片之间有节奏，但不要过度装饰。想请教下大家在 React 页面里处理这种列表时，会怎么控制密度、行高和卡片留白？",
        postId: 1002,
        uid: 102,
        avatar: "/default-shark-avatar.svg",
        nickname: "陈默",
        likeCount: 31,
        collectCount: 11,
        commentCount: 8,
        viewCount: 187,
        isTopped: false,
        createdAt: new Date("2026-04-17T14:26:00+08:00").getTime(),
    },
    {
        title: "安静的帖子流是不是更适合长期阅读？",
        summary: "我发现纯文字内容一旦边框、阴影和色块太多，读起来就会很累。现在倾向于让页面更克制一些，但又担心缺少重点，不知道大家会怎么拿捏这个平衡。",
        postId: 1003,
        uid: 103,
        avatar: "/default-shark-avatar.svg",
        nickname: "周意",
        likeCount: 67,
        collectCount: 24,
        commentCount: 16,
        viewCount: 356,
        isTopped: false,
        createdAt: new Date("2026-04-16T21:08:00+08:00").getTime(),
    },
];

export default function Post() {
    const [list, setList] = useState<ListItem[]>([]);
    const list


    return (
        <main className="post-page">
            <section className="post-page__feed" aria-label="帖子列表">
                {list.map((post) => (
                    <PostCard key={post.postId} {...post} />
                ))}
            </section>
        </main>
    );
}
