import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

import type { ApiError, AuthResult } from './types'

/**
 * 访问令牌放在 httpOnly Cookie 里，前端拿不到也不该拿到；
 * 这里只负责带上凭据、以及在 401 时做一次「单飞」刷新。
 */
const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

/** 除登录/注册/刷新/登出外，其余接口在 401 时都值得先尝试续期一次 */
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
    const url = config?.url ?? ''
    const isAuthCall = AUTH_ENDPOINTS.test(url)

    if (status === 401 && config && !config._retried && !isAuthCall) {
      config._retried = true
      const result = await refreshSession()
      if (result) {
        return http.request(config)
      }
    }

    // 401 交给上层统一跳登录页，不弹重复提示
    if (status !== 401) {
      const detail = error.response?.data?.detail
      ElMessage.error(typeof detail === 'string' ? detail : '网络异常，请稍后重试')
    }
    return Promise.reject(error)
  },
)

export default http
