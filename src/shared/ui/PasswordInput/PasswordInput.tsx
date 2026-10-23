import { useState } from 'react'
import { Input } from '../Input'
import { useLanguage } from '../../i18n/LanguageContext'
import './PasswordInput.css'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
}

export function PasswordInput({ error = false, disabled, className = '', ...props }: PasswordInputProps) {
  const { t } = useLanguage()
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
        aria-label={isVisible ? t.common.hidePassword : t.common.showPassword}
      >
        {isVisible ? t.common.hide : t.common.show}
      </button>
    </div>
  )
}

