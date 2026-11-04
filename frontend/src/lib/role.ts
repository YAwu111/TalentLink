import type { Role } from '@/api/types'

export const ROLE_META: Record<
  Role,
  { label: string; badge: 'info' | 'teal' | 'warning' }
> = {
  seeker: { label: '求职者', badge: 'info' },
  employer: { label: '企业', badge: 'teal' },
  admin: { label: '系统管理员', badge: 'warning' },
}
