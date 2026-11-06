import { useEffect, useState } from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type ReviewMode = 'approve' | 'reject' | 'revoke'

interface ReviewActionDialogProps {
  open: boolean
  mode: ReviewMode | null
  companyName: string
  loading: boolean
  error: string
  onConfirm: (value: string) => void
  onClose: () => void
}

const COPY: Record<
  ReviewMode,
  { title: string; description: string; label: string; placeholder: string; confirm: string }
> = {
  approve: {
    title: '通过认证',
    description: '通过后企业认证状态会变为已认证，并将本次操作写入审核记录。',
    label: '审核备注（可选）',
    placeholder: '例如：材料齐全，信息一致',
    confirm: '确认通过',
  },
  reject: {
    title: '驳回认证',
    description: '驳回后企业会失去当前认证状态，原因会展示在审核记录中。',
    label: '驳回原因（必填）',
    placeholder: '请说明材料存在的问题，至少 2 个字',
    confirm: '确认驳回',
  },
  revoke: {
    title: '撤销认证',
    description: '撤销后企业认证状态会变为未认证，本次操作不可撤销。',
    label: '撤销原因（必填）',
    placeholder: '请说明撤销原因，至少 2 个字',
    confirm: '确认撤销',
  },
}

export function ReviewActionDialog({
  open,
  mode,
  companyName,
  loading,
  error,
  onConfirm,
  onClose,
}: ReviewActionDialogProps) {
  const [value, setValue] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!open) return
    setValue('')
    setLocalError('')
  }, [open, mode])

  const copy = mode ? COPY[mode] : COPY.approve
  const required = mode === 'reject' || mode === 'revoke'

  function handleConfirm() {
    const trimmed = value.trim()
    if (required && trimmed.length < 2) {
      setLocalError(`${mode === 'reject' ? '驳回' : '撤销'}原因至少需要 2 个字`)
      return
    }
    setLocalError('')
    onConfirm(trimmed)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[460px]" showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {companyName} · {copy.description}
          </DialogDescription>
        </DialogHeader>

        {error || localError ? (
          <Alert
            variant="destructive"
            className="border-destructive/20 bg-destructive/5"
          >
            <AlertCircle />
            <AlertDescription>{error || localError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="review-note">{copy.label}</Label>
          <Textarea
            id="review-note"
            value={value}
            maxLength={500}
            rows={4}
            placeholder={copy.placeholder}
            disabled={loading}
            onChange={(event) => {
              setValue(event.target.value)
              if (localError) setLocalError('')
            }}
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {value.length}/500
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            variant={mode === 'approve' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <LoaderCircle className="animate-spin" /> : null}
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
