import './Input.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error = false, className = '', ...props }: InputProps) {
  return (
    <input
      className={`input ${error ? 'input--error' : ''} ${className}`}
      aria-invalid={error}
      {...props}
    />
  )
}

