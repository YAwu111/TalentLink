import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react'

import { identityProvider } from '@/api/recognition'
import { DocumentDropzone } from '@/components/upload/DocumentDropzone'
import { FileCard } from '@/components/upload/FileCard'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVerificationStatus } from '@/hooks/useVerificationStatus'
import { errorText } from '@/lib/error'
import { validateUploadFile } from '@/lib/file'
import { formatDateTime, formatTime } from '@/lib/format'

type IdentityPhase =
  | 'idle'
  | 'file_selected'
  | 'uploading'
  | 'submitted'
  | 'error'

export function IdentityUploadPanel() {
  const verification = useVerificationStatus()
  const current = verification.current
  const isPending = current?.status === 'pending'
  const isMock = identityProvider.id === 'mock'

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
    if (!file || isPending) return
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
      setFile(null)
      void verification.reload()
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
          <Badge variant={isMock ? 'neutral' : 'info'}>
            {isMock ? '联调模拟' : '管理员审核'}
          </Badge>
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
              {isMock
                ? '提交后由管理员审核；当前为模拟流程，不会修改企业认证状态'
                : '提交后进入管理员审核队列，通过或驳回后认证状态会更新'}
            </li>
          </ul>
        </div>

        {current ? (
          <Alert
            className={
              current.status === 'approved'
                ? 'border-emerald-200/80 bg-emerald-50 text-emerald-900'
                : current.status === 'rejected'
                  ? 'border-destructive/20 bg-destructive/5 text-destructive'
                  : 'border-amber-200/80 bg-amber-50 text-amber-900'
            }
          >
            {current.status === 'approved' ? (
              <CheckCircle2 />
            ) : current.status === 'rejected' ? (
              <AlertCircle />
            ) : (
              <Clock3 />
            )}
            <AlertDescription>
              <span className="font-medium">
                {current.status === 'pending'
                  ? '认证申请待审核'
                  : current.status === 'approved'
                    ? '企业认证已通过'
                    : current.status === 'rejected'
                      ? '认证申请已驳回'
                      : '认证已撤销'}
              </span>
              <span className="mt-1 block">
                第 {current.version} 次申请 · 提交于{' '}
                {formatDateTime(current.submitted_at)}
                {current.reviewed_at
                  ? ` · 审核于 ${formatDateTime(current.reviewed_at)}`
                  : ''}
              </span>
              {current.reject_reason ? (
                <span className="mt-1 block">
                  驳回原因：{current.reject_reason}
                </span>
              ) : current.review_note ? (
                <span className="mt-1 block">
                  审核说明：{current.review_note}
                </span>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {verification.error ? (
          <Alert
            variant="destructive"
            className="border-destructive/20 bg-destructive/5"
          >
            <AlertCircle />
            <AlertDescription>{verification.error}</AlertDescription>
          </Alert>
        ) : null}

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

        {phase === 'submitted' && isMock ? (
          <Alert className="border-emerald-200/80 bg-emerald-50 text-emerald-900">
            <CheckCircle2 />
            <AlertDescription className="text-emerald-900/90">
              身份材料已提交审核（模拟），提交时间 {formatTime(submittedAt)}。
              刷新页面后模拟状态会重置。
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

        {isPending ? (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            当前已有待审核申请，管理员处理前不能重复提交。
            {current ? (
              <p className="mt-2 text-amber-900/80">
                材料：{current.document.original_name}
              </p>
            ) : null}
          </div>
        ) : file ? (
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

        {!isPending ? (
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
                {isMock ? '提交审核（模拟）' : '提交审核'}
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
