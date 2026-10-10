import './Alert.css'

export type AlertVariant = 'error' | 'success' | 'info' | 'warning'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  message?: string
  className?: string
}

export function Alert({ variant = 'info', title, message, className = '' }: AlertProps) {
  const role = variant === 'error' ? 'alert' : 'status'
  return (
    <div className={`alert alert--${variant} ${className}`} role={role}>
      {title && <div className="alert__title">{title}</div>}
      {message && <div className="alert__message">{message}</div>}
    </div>
  )
}

