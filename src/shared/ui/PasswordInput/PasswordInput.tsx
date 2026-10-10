import { useState } from 'react'
import { Input } from '../Input'
import { ka } from '../../i18n/ka'
import './PasswordInput.css'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
}

export function PasswordInput({ error = false, disabled, className = '', ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev)
  }

  return (
    <div className={`password-input ${error ? 'password-input--error' : ''} ${className}`}>
      <Input
        type={isVisible ? 'text' : 'password'}
        error={error}
        disabled={disabled}
        {...props}
      />
      <button
        type="button"
        className="password-input__toggle"
        onClick={toggleVisibility}
        disabled={disabled}
        aria-label={isVisible ? ka.common.hidePassword : ka.common.showPassword}
      >
        {isVisible ? ka.common.hide : ka.common.show}
      </button>
    </div>
  )
}

