import type { CompanyProfile } from '@/api/company'
import type { SeekerProfile } from '@/api/seeker'
import { useAuthStore } from '@/stores/auth'

/** 企业资料保存后同步登录态，避免顶栏/工作台仍显示旧企业名。 */
export function syncEmployerProfile(profile: CompanyProfile): void {
  const { user } = useAuthStore.getState()
  if (!user || user.role !== 'employer') return

  useAuthStore.setState({
    user: {
      ...user,
      display_name: profile.name.trim() || user.username,
      profile: {
        ...(user.profile ?? {}),
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        intro: profile.intro,
        industry: profile.industry,
        verified: profile.verified,
      },
    },
  })
}

export function syncSeekerProfile(profile: SeekerProfile): void {
  const { user } = useAuthStore.getState()
  if (!user || user.role !== 'seeker') return

  useAuthStore.setState({
    user: {
      ...user,
      display_name: profile.name.trim() || user.username,
      profile: {
        ...(user.profile ?? {}),
        ...profile,
      },
    },
  })
}
