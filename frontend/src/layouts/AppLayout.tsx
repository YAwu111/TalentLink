import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { LogOut } from 'lucide-react'

import { PageLoading } from '@/components/ui/page-loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ROLE_META } from '@/lib/role'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const BASE_NAV: NavItem[] = [{ to: '/', label: '工作台', end: true }]

const EMPLOYER_NAV: NavItem[] = [
  { to: '/employer/profile', label: '企业资料', end: true },
  { to: '/employer/profile/upload', label: '资料上传', end: true },
  { to: '/employer/jobs', label: '岗位管理', end: true },
  { to: '/employer/applications', label: '投递管理', end: true },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/verifications', label: '认证审核', end: true },
]

const SEEKER_NAV: NavItem[] = [
  { to: '/seeker/profile', label: '个人资料', end: true },
  { to: '/seeker/jobs', label: '岗位', end: true },
  { to: '/seeker/applications', label: '我的投递', end: true },
  { to: '/seeker/offers', label: '录用通知', end: true },
]

export function AppLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) return null

  const role = ROLE_META[user.role]
  const items =
    user.role === 'employer'
      ? [...BASE_NAV, ...EMPLOYER_NAV]
      : user.role === 'admin'
        ? [...BASE_NAV, ...ADMIN_NAV]
        : user.role === 'seeker'
          ? [...BASE_NAV, ...SEEKER_NAV]
          : BASE_NAV

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      setLogoutOpen(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-white/85 backdrop-blur-md print:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:h-16 md:flex-nowrap md:px-6 md:py-0">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
              T
            </span>
            <span className="text-lg font-semibold tracking-tight">TalentLink</span>
          </Link>

          <nav
            aria-label="主导航"
            className="order-last flex w-full items-center gap-1 overflow-x-auto border-t border-border/60 pt-2 md:order-none md:ml-4 md:w-auto md:border-0 md:pt-0"
          >
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-9 shrink-0 items-center px-2.5 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <span className="relative flex h-full items-center">
                    {item.label}
                    {isActive ? (
                      <motion.span
                        layoutId="app-nav-underline"
                        className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    ) : null}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant={role.badge}>{role.label}</Badge>
            {user.display_name !== role.label ? (
              <span className="hidden max-w-[180px] truncate text-[13px] text-muted-foreground sm:inline">
                {user.display_name}
              </span>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setLogoutOpen(true)}
            >
              <LogOut className="size-4" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10 print:max-w-none print:p-0">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <ConfirmDialog
        open={logoutOpen}
        title="退出登录"
        message="确定要退出登录吗？"
        confirmText="退出"
        loading={loggingOut}
        onConfirm={() => void handleLogout()}
        onClose={() => setLogoutOpen(false)}
      />
    </div>
  )
}
