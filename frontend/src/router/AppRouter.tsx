import { lazy, Suspense, type ReactNode } from 'react'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { BootScreen } from '@/components/ui/boot-screen'
import { useAuthStore } from '@/stores/auth'

const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  })),
)
const HomePage = lazy(() =>
  import('@/pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const CompanyProfilePage = lazy(() =>
  import('@/pages/employer/CompanyProfilePage').then((module) => ({
    default: module.CompanyProfilePage,
  })),
)
const CompanyUploadPage = lazy(() =>
  import('@/pages/employer/CompanyUploadPage').then((module) => ({
    default: module.CompanyUploadPage,
  })),
)
const VerificationReviewPage = lazy(() =>
  import('@/pages/admin/VerificationReviewPage').then((module) => ({
    default: module.VerificationReviewPage,
  })),
)

function ProtectedLayout() {
  const user = useAuthStore((state) => state.user)
  const bootstrapped = useAuthStore((state) => state.bootstrapped)
  const location = useLocation()

  if (!bootstrapped) return <BootScreen />
  if (!user) {
    const redirect = `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }
  return <Outlet />
}

function GuestOnlyLayout() {
  const user = useAuthStore((state) => state.user)
  const bootstrapped = useAuthStore((state) => state.bootstrapped)

  if (!bootstrapped) return <BootScreen />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

function RoleGate({ role, children }: { role: string; children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  if (!user || user.role !== role) return <Navigate to="/" replace />
  return children
}

function authFallback(node: ReactNode) {
  return <Suspense fallback={<BootScreen />}>{node}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <GuestOnlyLayout />,
    children: [{ index: true, element: authFallback(<LoginPage />) }],
  },
  {
    path: '/register',
    element: <GuestOnlyLayout />,
    children: [{ index: true, element: authFallback(<RegisterPage />) }],
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          {
            path: 'employer/profile',
            element: (
              <RoleGate role="employer">
                <CompanyProfilePage />
              </RoleGate>
            ),
          },
          {
            path: 'employer/profile/upload',
            element: (
              <RoleGate role="employer">
                <CompanyUploadPage />
              </RoleGate>
            ),
          },
          {
            path: 'admin/verifications',
            element: (
              <RoleGate role="admin">
                <VerificationReviewPage />
              </RoleGate>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
