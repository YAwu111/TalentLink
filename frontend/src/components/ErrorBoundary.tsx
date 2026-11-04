import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** 页面级兜底：渲染异常留痕，并给用户一个恢复出口。 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[react-error ${new Date().toISOString()}]`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[100dvh] place-items-center bg-background p-6">
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center shadow-[0_24px_60px_-24px_rgba(15,23,42,0.2)]">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-7" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">页面出了点问题</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              错误已记录到浏览器控制台，刷新后可继续使用。
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
