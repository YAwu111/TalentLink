import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { authApi } from '@/api/auth'
import { refreshSession } from '@/api/http'
import type { AuthResult, AuthUser, LoginPayload, RegisterPayload } from '@/api/types'

/** 提前多少秒续期，避免请求恰好撞在过期瞬间 */
const REFRESH_LEAD_SECONDS = 15

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

  async function login(payload: LoginPayload) {
    submitting.value = true
    try {
      applySession(await authApi.login(payload))
    } finally {
      submitting.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    submitting.value = true
    try {
      applySession(await authApi.register(payload))
    } finally {
      submitting.value = false
    }
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
      scheduleRefresh(60)
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
