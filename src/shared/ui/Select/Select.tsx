import './Select.css'

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, children, className = '', ...props }: SelectProps) {
  return (
    <div className={`select-wrapper ${className}`}>
      {label && <label className="select__label">{label}</label>}
      <div className="select__container">
        <select
          className={`select ${error ? 'select--error' : ''}`}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
      </div>
      {error && <span className="select__error" role="alert">{error}</span>}
    </div>
  )
}

