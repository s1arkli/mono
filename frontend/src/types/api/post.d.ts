/** 帖子列表请求参数，对应后端 ListReq。 */
export interface ListReq {
    page: number;
    pageSize: number;
    postType: number;
    sort: number;
}

/** 帖子列表响应结构，对应后端 ListResp。 */
export interface ListResp {
    posts: ListItem[];
    total: number;
}

/** 帖子列表项结构，对应后端 ListItem。 */
export interface ListItem {
    title: string;
    summary: string;
    postId: number;
    uid: number;
    avatar: string;
    nickname: string;
    likeCount: number;
    collectCount: number;
    commentCount: number;
    viewCount: number;
    isTopped: boolean;
    createdAt: number;
}
