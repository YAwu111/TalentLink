import http from './http'
import type { AuthResult, AuthUser, LoginPayload, RegisterPayload } from './types'

export const authApi = {
  login(payload: LoginPayload) {
    return http.post<AuthResult>('/auth/login', payload).then((res) => res.data)
  },

  register(payload: RegisterPayload) {
    return http.post<AuthResult>('/auth/register', payload).then((res) => res.data)
  },

  logout() {
    return http.post('/auth/logout')
  },

  me() {
    return http.get<AuthUser>('/auth/me').then((res) => res.data)
  },
}
