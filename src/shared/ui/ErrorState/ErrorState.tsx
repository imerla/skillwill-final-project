import { ka } from '../../i18n/ka'
import { Button } from '../Button/Button'
import './ErrorState.css'

interface ErrorStateProps {
  title?: string
  actionLabel?: string
  onAction?(): void
}

export function ErrorState({ title = ka.common.loadFailed, actionLabel = ka.common.retry, onAction }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <h2 className="error-state__title">{title}</h2>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

