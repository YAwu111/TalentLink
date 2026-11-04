import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { authApi } from '@/api/auth'
import { refreshSession } from '@/api/http'
import type { AuthResult, AuthUser, LoginPayload, RegisterPayload } from '@/api/types'

/** 提前多少秒续期，避免请求恰好撞在过期瞬间 */
const REFRESH_LEAD_SECONDS = 15

/**
 * 会话恢复时拿不到服务端的 expires_in（/auth/me 只返回用户），
 * 按后端 ACCESS_TOKEN_EXPIRE_MINUTES=1 的约定估一个，下一次刷新后会回到精确值。
 */
const ACCESS_TTL_FALLBACK_SECONDS = 60

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const bootstrapped = ref(false)
  const submitting = ref(false)

  let refreshTimer: number | undefined

  const isAuthenticated = computed(() => user.value !== null)
  const role = computed(() => user.value?.role ?? null)
  const displayName = computed(() => user.value?.display_name ?? '')

  function clearRefreshTimer() {
    if (refreshTimer !== undefined) {
      window.clearTimeout(refreshTimer)
      refreshTimer = undefined
    }
  }

  /** 按服务端返回的有效期安排下一次静默续期 */
  function scheduleRefresh(expiresIn: number) {
    clearRefreshTimer()
    const delay = Math.max(expiresIn - REFRESH_LEAD_SECONDS, 5) * 1000
    refreshTimer = window.setTimeout(async () => {
      const result = await refreshSession()
      if (result) {
        applySession(result)
      } else {
        user.value = null
        clearRefreshTimer()
      }
    }, delay)
  }

  function applySession(result: AuthResult) {
    user.value = result.user
    scheduleRefresh(result.expires_in)
  }

  /** 登录/注册共用：统一维护提交态，避免按钮重复点击 */
  async function submitSession(action: () => Promise<AuthResult>) {
    submitting.value = true
    try {
      applySession(await action())
    } finally {
      submitting.value = false
    }
  }

  function login(payload: LoginPayload) {
    return submitSession(() => authApi.login(payload))
  }

  function register(payload: RegisterPayload) {
    return submitSession(() => authApi.register(payload))
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      user.value = null
      clearRefreshTimer()
    }
  }

  /** 应用启动时恢复会话：访问令牌可能已过期，http 层会自动续期一次 */
  async function bootstrap() {
    if (bootstrapped.value) return
    bootstrapped.value = true
    try {
      user.value = await authApi.me()
      scheduleRefresh(ACCESS_TTL_FALLBACK_SECONDS)
    } catch {
      user.value = null
    }
  }

  return {
    user,
    isAuthenticated,
    role,
    displayName,
    submitting,
    login,
    register,
    logout,
    bootstrap,
  }
})
