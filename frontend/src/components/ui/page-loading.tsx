import { LoaderCircle } from 'lucide-react'

export function PageLoading({ label = '正在加载…' }: { label?: string }) {
  return (
    <div className="grid min-h-[45vh] place-items-center">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        {label}
      </p>
    </div>
  )
}
