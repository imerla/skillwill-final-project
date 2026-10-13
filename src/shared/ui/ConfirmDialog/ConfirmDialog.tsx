import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '../Button/Button'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'დადასტურება',
  cancelLabel = 'გაუქმება',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="confirm-dialog__header">
          <h2 id="confirm-dialog-title" className="confirm-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="confirm-dialog__close"
            onClick={onCancel}
            aria-label="დახურვა"
          >
            <X size={20} />
          </button>
        </div>
        <div className="confirm-dialog__body">
          <p id="confirm-dialog-message" className="confirm-dialog__message">
            {message}
          </p>
        </div>
        <div className="confirm-dialog__footer">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'primary' : 'secondary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
