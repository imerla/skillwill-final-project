import React, { useId } from 'react'
import './FormField.css'

interface FormFieldProps {
  label: string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }) => React.ReactNode
  hint?: string
  error?: string
  id?: string
}

export function FormField({ label, children, hint, error, id }: FormFieldProps) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="form-field__label">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="form-field__hint">
          {hint}
        </p>
      )}
      <div className="form-field__input">
        {children({ id: fieldId, 'aria-describedby': describedBy, 'aria-invalid': !!error })}
      </div>
      {error && (
        <p id={errorId} className="form-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
