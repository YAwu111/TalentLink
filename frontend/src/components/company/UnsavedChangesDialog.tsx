import { LoaderCircle } from 'lucide-react'

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

interface UnsavedChangesDialogProps {
  open: boolean
  saving: boolean
  error?: string
  onSaveAndLeave: () => void
  onDiscard: () => void
  onClose: () => void
}

export function UnsavedChangesDialog({
  open,
  saving,
  error,
  onSaveAndLeave,
  onDiscard,
  onClose,
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[420px]" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>有未保存的修改</DialogTitle>
          <DialogDescription>
            离开当前页面会丢失尚未保存的内容。可以先保存，再继续跳转。
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert
            variant="destructive"
            className="border-destructive/20 bg-destructive/5"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onDiscard} disabled={saving}>
            直接离开
          </Button>
          <Button onClick={onSaveAndLeave} disabled={saving}>
            {saving ? <LoaderCircle className="animate-spin" /> : null}
            保存并离开
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
