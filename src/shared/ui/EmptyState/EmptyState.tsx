import { Button } from '../Button/Button'
import { Search, ShoppingCart, Package } from 'lucide-react'
import './EmptyState.css'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?(): void
  illustration?: 'search' | 'cart' | 'package' | 'none'
}

export function EmptyState({ title, description, actionLabel, onAction, illustration = 'package' }: EmptyStateProps) {
  const IllustrationIcon = illustration === 'search' ? Search : illustration === 'cart' ? ShoppingCart : Package

  return (
    <div className="empty-state">
      {illustration !== 'none' && (
        <div className="empty-state__illustration">
          <IllustrationIcon size={64} strokeWidth={1.5} />
        </div>
      )}
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__description">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

