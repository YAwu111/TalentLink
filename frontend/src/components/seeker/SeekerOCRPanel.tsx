import { useEffect, useRef, useState } from 'react'
import { AlertCircle, LoaderCircle, Sparkles } from 'lucide-react'

import { seekerApi, type SeekerRecognitionResult } from '@/api/seeker'
import { DocumentDropzone } from '@/components/upload/DocumentDropzone'
import { FileCard } from '@/components/upload/FileCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { errorText } from '@/lib/error'
import { validateUploadFile } from '@/lib/file'
import {
  SEEKER_FORM_FIELDS,
  SEEKER_LABELS,
  type SeekerField,
  type SeekerFormValues,
} from '@/lib/seeker'
import { cn } from '@/lib/utils'

interface SeekerOCRPanelProps {
  currentValues: SeekerFormValues
  onApply: (values: Partial<SeekerFormValues>) => void
}

type Phase = 'idle' | 'file_selected' | 'recognizing' | 'success' | 'error'

export function SeekerOCRPanel({
  currentValues,
  onApply,
}: SeekerOCRPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<SeekerRecognitionResult | null>(null)
  const [selected, setSelected] = useState<Set<SeekerField>>(new Set())
  const [error, setError] = useState('')
  const [fileError, setFileError] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const sequenceRef = useRef(0)

  useEffect(() => {
    return () => {
      sequenceRef.current += 1
      abortRef.current?.abort()
    }
  }, [])

  function selectFile(nextFile: File) {
    abortRef.current?.abort()
    sequenceRef.current += 1
    const validationError = validateUploadFile(nextFile, 'intro')
    if (validationError) {
      setFile(null)
      setFileError(validationError)
      setPhase('idle')
      setError('')
      return
    }
    setFile(nextFile)
    setFileError('')
    setError('')
    setResult(null)
    setSelected(new Set())
    setProgress(0)
    setPhase('file_selected')
  }

  async function start() {
    if (!file) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const currentSequence = ++sequenceRef.current
    setPhase('recognizing')
    setProgress(0)
    setError('')
    setResult(null)
    setSelected(new Set())

    try {
      const data = await seekerApi.recognize(file, {
        signal: controller.signal,
        onProgress: (value) => {
          if (sequenceRef.current === currentSequence) setProgress(value)
        },
      })
      if (sequenceRef.current !== currentSequence) return
      setResult(data)
      setPhase('success')
      const initial = new Set<SeekerField>()
      for (const field of SEEKER_FORM_FIELDS) {
        const parsed = data.fields[field]?.value?.trim()
        if (parsed && !currentValues[field].trim()) initial.add(field)
      }
      setSelected(initial)
    } catch (err) {
      if (sequenceRef.current !== currentSequence) return
      if (err instanceof DOMException && err.name === 'AbortError') {
        setPhase('file_selected')
        return
      }
      setError(errorText(err, '简历识别失败，请稍后重试'))
      setPhase('error')
    }
  }

  function cancel() {
    abortRef.current?.abort()
    sequenceRef.current += 1
    setPhase(file ? 'file_selected' : 'idle')
    setProgress(0)
  }

  function toggle(field: SeekerField) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(field)) next.delete(field)
      else next.add(field)
      return next
    })
  }

  function apply() {
    if (!result) return
    const values: Partial<SeekerFormValues> = {}
    for (const field of selected) {
      const parsed = result.fields[field]?.value
      if (parsed) values[field] = parsed
    }
    if (Object.keys(values).length > 0) onApply(values)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
        上传简历或相关材料，系统使用本地 OCR 与规则抽取字段；文件只在本次识别期间临时保存，不会作为附件长期保存。
      </div>

      {fileError ? (
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/5"
        >
          <AlertCircle />
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      ) : null}

      {file ? (
        <FileCard
          file={file}
          disabled={phase === 'recognizing'}
          onRemove={() => {
            abortRef.current?.abort()
            sequenceRef.current += 1
            setFile(null)
            setResult(null)
            setSelected(new Set())
            setPhase('idle')
            setProgress(0)
          }}
        />
      ) : (
        <DocumentDropzone
          category="intro"
          disabled={phase === 'recognizing'}
          onSelect={selectFile}
        />
      )}

      {phase === 'recognizing' ? (
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              正在上传并识别简历…
            </p>
            <span className="text-xs tabular-nums text-muted-foreground">
              {Math.min(progress, 100)}%
            </span>
          </div>
          <Progress value={progress} className="mt-3 h-2" />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              本地 OCR / 规则识别，不调用外部模型
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={cancel}>
              取消
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/5"
        >
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {phase === 'file_selected' || phase === 'error' ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => void start()} disabled={!file}>
            开始识别
          </Button>
        </div>
      ) : null}

      {phase === 'success' && result ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">
              <Sparkles />
              识别完成
            </Badge>
            <Badge variant="info">
              置信度 {Math.round(result.confidence * 100)}%
            </Badge>
            <Badge variant="neutral">本地识别</Badge>
            <span className="text-xs text-muted-foreground">
              识别到 {Object.keys(result.fields).length} 项
            </span>
          </div>

          {result.warnings.length > 0 ? (
            <Alert className="border-amber-200/80 bg-amber-50 text-amber-900">
              <AlertCircle />
              <AlertDescription className="text-amber-900/90">
                {result.warnings.join(' ')}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2.5">
            {SEEKER_FORM_FIELDS.map((field) => {
              const parsed = result.fields[field]
              const parsedValue = parsed?.value?.trim() ?? ''
              const current = currentValues[field].trim()
              const state = !parsedValue
                ? 'missing'
                : !current
                  ? 'fill'
                  : current === parsedValue
                    ? 'same'
                    : 'overwrite'
              const disabled = state === 'missing'
              return (
                <div
                  key={field}
                  className={cn(
                    'rounded-xl border p-3',
                    selected.has(field)
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/70 bg-card',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`seeker-parsed-${field}`}
                      checked={selected.has(field)}
                      disabled={disabled}
                      onCheckedChange={() => toggle(field)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`seeker-parsed-${field}`}
                      className="min-w-0 flex-1 cursor-pointer select-none"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {SEEKER_LABELS[field]}
                        </span>
                        <Badge
                          variant={
                            state === 'fill'
                              ? 'info'
                              : state === 'same'
                                ? 'success'
                                : state === 'overwrite'
                                  ? 'warning'
                                  : 'neutral'
                          }
                        >
                          {state === 'fill'
                            ? '将填充'
                            : state === 'same'
                              ? '内容一致'
                              : state === 'overwrite'
                                ? '将覆盖'
                                : '未识别'}
                        </Badge>
                        {parsed ? (
                          <span className="text-[10.5px] text-muted-foreground">
                            置信度 {Math.round(parsed.confidence * 100)}%
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-2 grid gap-1 text-xs leading-relaxed">
                        <span className="text-muted-foreground">
                          当前：
                          <span className="ml-1 text-foreground/80">
                            {current || '空白'}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          识别：
                          <span className="ml-1 text-foreground">
                            {parsedValue || '未识别'}
                          </span>
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            默认只勾选空白字段；已有内容需要手动勾选覆盖。应用后会合并到表单并触发自动保存。
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border/70 pt-4">
            <span className="text-xs text-muted-foreground">
              已选择 {selected.size} 个字段
            </span>
            <Button
              type="button"
              onClick={apply}
              disabled={selected.size === 0}
            >
              应用 {selected.size} 个字段
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}
