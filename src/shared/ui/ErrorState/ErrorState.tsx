import { useLanguage } from '../../i18n/LanguageContext'
import { Button } from '../Button/Button'
import './ErrorState.css'

interface ErrorStateProps {
  title?: string
  actionLabel?: string
  onAction?(): void
}

export function ErrorState({ title, actionLabel, onAction }: ErrorStateProps) {
  const { t } = useLanguage()
  const resolvedTitle = title ?? t.common.loadFailed
  const resolvedLabel = actionLabel ?? t.common.retry

  return (
    <div className="error-state" role="alert">
      <h2 className="error-state__title">{resolvedTitle}</h2>
      {resolvedLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {resolvedLabel}
        </Button>
      )}
    </div>
  )
}

