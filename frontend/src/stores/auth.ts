import { create } from 'zustand'

import { authApi } from '@/api/auth'
import { refreshSession } from '@/api/http'
import type {
  AuthResult,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/api/types'

/** 提前多少秒续期，避免请求恰好撞在过期瞬间 */
const REFRESH_LEAD_SECONDS = 15

/**
 * 会话恢复时拿不到服务端的 expires_in（/auth/me 只返回用户），
 * 按后端 ACCESS_TOKEN_EXPIRE_MINUTES=1 的约定估一个，下一次刷新后会回到精确值。
 */
const ACCESS_TTL_FALLBACK_SECONDS = 60

interface AuthState {
  user: AuthUser | null
  bootstrapped: boolean
  submitting: boolean
  bootstrap: () => Promise<void>
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

let refreshTimer: number | undefined
let booting: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set, get) => {
  function clearRefreshTimer() {
    if (refreshTimer !== undefined) {
      window.clearTimeout(refreshTimer)
      refreshTimer = undefined
    }
  }

  function clear() {
    clearRefreshTimer()
    set({ user: null })
  }

  function scheduleRefresh(expiresIn: number) {
    clearRefreshTimer()
    const delay = Math.max(expiresIn - REFRESH_LEAD_SECONDS, 5) * 1000
    refreshTimer = window.setTimeout(async () => {
      const result = await refreshSession()
      if (result) {
        applySession(result)
      } else {
        clear()
      }
    }, delay)
  }

  function applySession(result: AuthResult) {
    set({ user: result.user })
    scheduleRefresh(result.expires_in)
  }

  /** 登录/注册共用：统一维护提交态，避免按钮重复点击 */
  async function submitSession(action: () => Promise<AuthResult>) {
    set({ submitting: true })
    try {
      applySession(await action())
    } finally {
      set({ submitting: false })
    }
  }

  return {
    user: null,
    bootstrapped: false,
    submitting: false,

    async bootstrap() {
      if (get().bootstrapped) return
      if (booting) return booting
      booting = (async () => {
        try {
          const user = await authApi.me()
          set({ user })
          scheduleRefresh(ACCESS_TTL_FALLBACK_SECONDS)
        } catch {
          set({ user: null })
        } finally {
          set({ bootstrapped: true })
          booting = null
        }
      })()
      return booting
    },

    login(payload) {
      return submitSession(() => authApi.login(payload))
    },

    register(payload) {
      return submitSession(() => authApi.register(payload))
    },

    async logout() {
      try {
        await authApi.logout()
      } finally {
        clear()
      }
    },
  }
})

// 访问令牌续期失败时，统一清理登录态
const sessionWindow = window as Window & { __tlSessionBound?: boolean }
if (!sessionWindow.__tlSessionBound) {
  sessionWindow.__tlSessionBound = true
  window.addEventListener('tl:session-expired', () => {
    useAuthStore.setState({ user: null })
  })
}
