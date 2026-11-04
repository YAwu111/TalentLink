export type Role = 'seeker' | 'employer' | 'admin'

export type UserStatus = 'active' | 'disabled'

export interface AuthUser {
  id: number
  username: string
  role: Role
  status: UserStatus
  display_name: string
  profile: Record<string, unknown> | null
}

export interface AuthResult {
  user: AuthUser
  expires_in: number
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  role: Exclude<Role, 'admin'>
  display_name: string
}

export interface ApiError {
  detail?: string
}
