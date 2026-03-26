import { postJson } from '../lib/http'
import type { CreatePostPayload, PostListData, PostListPayload } from '../types/api'

const postBaseCandidates = ['/api/v1/post', '/post']

export function fetchPostList(payload: PostListPayload) {
  return postJson<PostListData, PostListPayload>('/list', payload, {
    baseCandidates: postBaseCandidates,
  })
}

export function createPost(payload: CreatePostPayload, accessToken: string) {
  return postJson<Record<string, never>, CreatePostPayload>('/create', payload, {
    accessToken,
    baseCandidates: postBaseCandidates,
  })
}
