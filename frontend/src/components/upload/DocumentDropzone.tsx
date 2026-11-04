import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

import { categoryFormatLabel, CATEGORY_ACCEPT, type UploadCategory } from '@/lib/file'
import { cn } from '@/lib/utils'

interface DocumentDropzoneProps {
  category: UploadCategory
  disabled?: boolean
  onSelect: (file: File) => void
}

export function DocumentDropzone({
  category,
  disabled = false,
  onSelect,
}: DocumentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) onSelect(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={CATEGORY_ACCEPT[category]}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'flex min-h-[210px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40',
          disabled && 'pointer-events-none opacity-60',
        )}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          if (!disabled) handleFiles(event.dataTransfer.files)
        }}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UploadCloud className="size-6" />
        </span>
        <span className="text-sm font-semibold">
          {dragActive ? '松开以选择文件' : '拖拽文件到这里，或点击选择'}
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          支持 {categoryFormatLabel(category)}，单个文件不超过 10MB
        </span>
        <span className="text-[10.5px] text-muted-foreground">
          {category === 'intro'
            ? '文件只用于本地模拟识别，不会上传服务器'
            : '当前为调试验证流程，不会上传服务器'}
        </span>
      </button>
    </div>
  )
}
