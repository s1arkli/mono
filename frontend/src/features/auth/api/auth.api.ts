/** 负责封装登录和注册相关的接口调用。 */
import { postJson } from '@/lib/http/client'
import type { LoginData, LoginPayload, RegisterPayload } from '@/features/auth/types/auth.types'

/**
 * @description 调用登录接口并返回登录成功后的令牌和用户基础信息。
 * @param payload LoginPayload，登录表单提交的账号和密码。
 * @returns Promise<LoginData>，登录成功后的访问令牌和用户信息。
 */
export function login(payload: LoginPayload) {
  return postJson<LoginData, LoginPayload>('/auth', payload)
}

/**
 * @description 调用注册接口创建新账号。
 * @param payload RegisterPayload，注册表单提交的账号和密码。
 * @returns Promise<string>，后端返回的注册结果消息。
 */
export function register(payload: RegisterPayload) {
  return postJson<string, RegisterPayload>('/register', payload)
}
