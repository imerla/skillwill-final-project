import { useId } from 'react'
import './Select.css'

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, children, className = '', id, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id || generatedId
  
  return (
    <div className={`select-wrapper ${className}`}>
      {label && <label htmlFor={selectId} className="select__label">{label}</label>}
      <div className="select__container">
        <select
          id={selectId}
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

