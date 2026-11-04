import type { ReactNode } from 'react'

import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel'
import { FadeIn } from '@/components/motion/fade-in'
import { Card, CardContent } from '@/components/ui/card'

interface AuthShellProps {
  subtitle?: string
  children: ReactNode
}

export function AuthShell({ subtitle, children }: AuthShellProps) {
  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel subtitle={subtitle} />

      <main className="flex items-center justify-center overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f6f9fe_100%)] p-5 sm:p-8">
        <FadeIn className="w-full max-w-[440px]">
          <Card className="gap-0 rounded-2xl border-border/70 bg-card py-0 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.2)] ring-0">
            <CardContent className="p-7 sm:p-9">{children}</CardContent>
          </Card>
        </FadeIn>
      </main>
    </div>
  )
}
