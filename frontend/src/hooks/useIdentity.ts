/** 负责在本地生成并持久化匿名语音身份标识。 */
import { useState } from 'react'

const VOICE_IDENTITY_KEY = 'voice_identity'

function createIdentity() {
  const randomUUID = globalThis.crypto?.randomUUID?.()
  if (randomUUID) {
    return randomUUID
  }

  return `voice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function resolveStoredIdentity() {
  if (typeof window === 'undefined') {
    return createIdentity()
  }

  try {
    const storedIdentity = window.localStorage.getItem(VOICE_IDENTITY_KEY)?.trim()
    if (storedIdentity) {
      return storedIdentity
    }

    const nextIdentity = createIdentity()
    window.localStorage.setItem(VOICE_IDENTITY_KEY, nextIdentity)
    return nextIdentity
  } catch {
    return createIdentity()
  }
}

/**
 * @description 读取或初始化当前浏览器的语音身份，保证刷新后仍复用同一个匿名 ID（标识）。
 * @returns string，当前浏览器持久化的语音身份。
 */
export function useIdentity() {
  const [identity] = useState(resolveStoredIdentity)
  return identity
}
