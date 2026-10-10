import { ka } from '../../i18n/ka'
import './Spinner.css'

interface SpinnerProps {
  size?: 'sm' | 'md'
  label?: string
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <div className={`spinner spinner--${size}`} role="status" aria-label={label ?? ka.common.loadingStatus}>
      <span className="visually-hidden">{label ?? ka.common.loadingStatus}</span>
    </div>
  )
}

