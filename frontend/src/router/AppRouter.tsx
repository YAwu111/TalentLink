import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

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

function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const bootstrapped = useAuthStore((state) => state.bootstrapped)
  const location = useLocation()

  if (!bootstrapped) return <BootScreen />
  if (!user) {
    const redirect = `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  }
  return children
}

function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const bootstrapped = useAuthStore((state) => state.bootstrapped)

  if (!bootstrapped) return <BootScreen />
  if (user) return <Navigate to="/" replace />
  return children
}

export function AppRouter() {
  return (
    <Suspense fallback={<BootScreen />}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnlyRoute>
              <RegisterPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
