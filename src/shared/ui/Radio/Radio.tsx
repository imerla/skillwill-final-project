import './Radio.css'

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  count?: number
}

export function Radio({ label, count, className = '', ...props }: RadioProps) {
  return (
    <label className={`radio ${className}`}>
      <input type="radio" className="radio__input" {...props} />
      <span className="radio__box" />
      <span className="radio__label">{label}</span>
      {count !== undefined && <span className="radio__count"> ({count})</span>}
    </label>
  )
}

