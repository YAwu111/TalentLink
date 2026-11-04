import { LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { RecognitionStage } from '@/api/recognition'

interface UploadProgressProps {
  stage: RecognitionStage
  progress: number
  onCancel?: () => void
  kind?: 'recognition' | 'identity'
}

export function UploadProgress({
  stage,
  progress,
  onCancel,
  kind = 'recognition',
}: UploadProgressProps) {
  const isUploading = stage === 'uploading'
  const title =
    kind === 'identity'
      ? '正在上传身份材料…'
      : isUploading
        ? '正在上传文档…'
        : '正在识别文档内容…'

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-4" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <LoaderCircle className="size-4 animate-spin text-primary" />
          {title}
        </p>
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.min(progress, 100)}%
        </span>
      </div>
      <Progress value={progress} className="mt-3 h-2" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {kind === 'identity'
            ? '联调模拟：不会上传真实文件'
            : '联调模拟：不会读取文件内容'}
        </p>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            取消
          </Button>
        ) : null}
      </div>
    </div>
  )
}
