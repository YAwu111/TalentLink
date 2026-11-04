import type { ReactNode } from 'react'

import { AuthBrandPanel } from './AuthBrandPanel'

interface AuthShellProps {
  subtitle?: string
  children: ReactNode
}

export function AuthShell({ subtitle, children }: AuthShellProps) {
  return (
    <div className="auth-page">
      <AuthBrandPanel subtitle={subtitle} />
      <main className="auth-main">
        <section className="auth-card">{children}</section>
      </main>
    </div>
  )
}
