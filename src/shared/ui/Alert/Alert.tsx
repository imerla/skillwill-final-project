import './Alert.css'

export type AlertVariant = 'error' | 'success' | 'info'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  message?: string
  className?: string
}

export function Alert({ variant = 'info', title, message, className = '' }: AlertProps) {
  return (
    <div className={`alert alert--${variant} ${className}`} role="alert">
      {title && <div className="alert__title">{title}</div>}
      {message && <div className="alert__message">{message}</div>}
    </div>
  )
}
