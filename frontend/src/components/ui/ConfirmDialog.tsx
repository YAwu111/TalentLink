import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, loading, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <header className="modal__head">
          <h2 id="confirm-title">{title}</h2>
          <button type="button" className="icon-btn" aria-label="关闭" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="modal__body">
          <p className="confirm-text">{message}</p>
        </div>
        <footer className="modal__foot">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button loading={loading} onClick={onConfirm}>
            {confirmText}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
