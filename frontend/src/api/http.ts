import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

import type { ApiError, AuthResult } from './types'

/**
 * 访问令牌放在 httpOnly Cookie 里，前端拿不到也不该拿到；
 * 这里只负责带上凭据、以及在 401 时做一次「单飞」刷新。
 */
const http = axios.create({
  baseURL: '/api',
  timeout: 12000,
  withCredentials: true,
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

/** 登录/注册/刷新/登出自身不参与 401 重试，避免递归 */
const AUTH_ENDPOINTS = /\/auth\/(login|register|refresh|logout)/

let refreshPromise: Promise<AuthResult | null> | null = null

/**
 * 并发 401 时只发一次刷新请求：否则多个请求会各自轮换，
 * 后到的那几个会用已作废的令牌，直接触发服务端的「重用检测」把用户踢下线。
 */
export function refreshSession(): Promise<AuthResult | null> {
  if (!refreshPromise) {
    refreshPromise = http
      .post<AuthResult>('/auth/refresh')
      .then((res) => res.data)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthCall = AUTH_ENDPOINTS.test(config?.url ?? '')

    if (status === 401 && config && !config._retried && !isAuthCall) {
      config._retried = true
      const result = await refreshSession()
      if (result) {
        return http.request(config)
      }
    }

    // 刷新也失败，说明会话已不可恢复；通知 store 清理登录态
    if (status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event('tl:session-expired'))
    }

    return Promise.reject(error)
  },
)

export default http
