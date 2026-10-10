import './Badge.css'

interface BadgeProps {
  variant?: 'neutral' | 'accent' | 'success' | 'danger'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return <span className={`badge badge--${variant} ${className}`}>{children}</span>
}

