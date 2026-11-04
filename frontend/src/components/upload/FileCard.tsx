import { FileText, Image, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fileExtension, formatFileSize, isImageFile } from '@/lib/file'

interface FileCardProps {
  file: File
  disabled?: boolean
  onRemove: () => void
}

export function FileCard({ file, disabled = false, onRemove }: FileCardProps) {
  const Icon = isImageFile(file) ? Image : FileText

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>
      <Badge variant="neutral" className="uppercase">
        {fileExtension(file.name) || 'FILE'}
      </Badge>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`移除文件 ${file.name}`}
        disabled={disabled}
        onClick={onRemove}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
