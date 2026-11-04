import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppRouter } from '@/router/AppRouter'
import { useAuthStore } from '@/stores/auth'

export default function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
