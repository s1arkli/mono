export interface ApiResponse<T> {
  code: number
  msg: string
  data?: T
}

export interface LoginPayload {
  account: string
  password: string
}

export type LoginData = string

export interface RegisterPayload {
  account: string
  password: string
}

export interface AuthSuccessState {
  account: string
  accessToken: string
  refreshToken?: string
}

export interface PostListPayload {
  page: number
  pageSize: number
  postType: number
  sort: number
}

export interface PostListItemDTO {
  title: string
  summary: string
  post_id: number
  uid: number
  avatar: string
  nickname: string
  like_count: number
  collect_count: number
  comment_count: number
  view_count: number
  is_topped: boolean
  created_at: number
}

export interface PostListData {
  posts?: PostListItemDTO[]
  total?: number
}

export interface CreatePostPayload {
  title: string
  content: string
  post_type: number
}
