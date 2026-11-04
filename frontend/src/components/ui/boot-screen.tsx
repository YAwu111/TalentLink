import { LoaderCircle } from 'lucide-react'

export function BootScreen() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
          T
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <LoaderCircle className="size-3.5 animate-spin" />
          正在恢复登录状态…
        </p>
      </div>
    </div>
  )
}
