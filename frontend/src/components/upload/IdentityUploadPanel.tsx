import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'

import { identityProvider } from '@/api/recognition'
import { DocumentDropzone } from '@/components/upload/DocumentDropzone'
import { FileCard } from '@/components/upload/FileCard'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { errorText } from '@/lib/error'
import { validateUploadFile } from '@/lib/file'
import { formatTime } from '@/lib/format'

type IdentityPhase =
  | 'idle'
  | 'file_selected'
  | 'uploading'
  | 'submitted'
  | 'error'

export function IdentityUploadPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<IdentityPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
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
    const validationError = validateUploadFile(nextFile, 'identity')
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
    setSubmittedAt(null)
    setProgress(0)
    setPhase('file_selected')
  }

  function reset() {
    abortRef.current?.abort()
    sequenceRef.current += 1
    setFile(null)
    setPhase('idle')
    setProgress(0)
    setSubmittedAt(null)
    setError('')
    setFileError('')
  }

  function cancel() {
    abortRef.current?.abort()
    sequenceRef.current += 1
    setProgress(0)
    setPhase(file ? 'file_selected' : 'idle')
  }

  async function submit() {
    if (!file) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const currentSequence = ++sequenceRef.current

    setPhase('uploading')
    setProgress(0)
    setError('')

    try {
      const result = await identityProvider.submit(file, {
        signal: controller.signal,
        onProgress: (value) => {
          if (sequenceRef.current === currentSequence) setProgress(value)
        },
      })
      if (sequenceRef.current !== currentSequence) return
      setSubmittedAt(result.submittedAt)
      setPhase('submitted')
    } catch (err) {
      if (sequenceRef.current !== currentSequence) return
      if (err instanceof DOMException && err.name === 'AbortError') {
        setPhase('file_selected')
        return
      }
      setError(errorText(err, '提交失败，请稍后重试'))
      setPhase('error')
    }
  }

  return (
    <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <CardTitle className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
          <ShieldCheck className="size-4 text-primary" />
          上传身份验证材料
          <Badge variant="neutral">联调模拟</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 px-5 py-5">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <p className="text-xs font-medium">材料要求</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              营业执照或企业认证材料，信息完整可见
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              支持 PDF、PNG、JPG，单个文件不超过 10MB
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              提交后由管理员审核；当前为模拟流程，不会修改企业认证状态
            </li>
          </ul>
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

        {phase === 'uploading' && file ? (
          <UploadProgress
            stage="uploading"
            progress={progress}
            kind="identity"
            onCancel={cancel}
          />
        ) : null}

        {phase === 'submitted' ? (
          <Alert className="border-emerald-200/80 bg-emerald-50 text-emerald-900">
            <CheckCircle2 />
            <AlertDescription className="text-emerald-900/90">
              身份材料已提交审核（模拟），提交时间 {formatTime(submittedAt)}。
              刷新页面后模拟状态会重置；真实审核将在管理员模块接入。
            </AlertDescription>
          </Alert>
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

        {file ? (
          <FileCard
            file={file}
            disabled={phase === 'uploading'}
            onRemove={reset}
          />
        ) : (
          <DocumentDropzone
            category="identity"
            disabled={phase === 'uploading'}
            onSelect={selectFile}
          />
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {phase === 'submitted' ? (
            <Button type="button" variant="outline" onClick={reset}>
              重新提交
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={!file || phase === 'uploading'}
            >
              提交审核（模拟）
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
