import { useState } from 'react'
import { useLanguage, type Translations } from '../../i18n/LanguageContext'
import './QuantityStepper.css'

interface QuantityStepperProps {
  value: number
  onChange(value: number): void
  min?: number
  max?: number
  disabled?: boolean
  label?: string
  t?: Translations
}

export function QuantityStepper({ value, onChange, min = 1, max = 999, disabled = false, label, t: propT }: QuantityStepperProps) {
  const { t: hookT } = useLanguage()
  const t = propT || hookT
  const [inputValue, setInputValue] = useState(value.toString())

  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrease = () => {
    if (value < max && !disabled) {
      onChange(value + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
  }

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue, 10)
    if (isNaN(numValue) || numValue < min) {
      setInputValue(min.toString())
      onChange(min)
    } else if (numValue > max) {
      // Call onChange with invalid value so parent can detect and show error
      onChange(numValue)
      // But reset input display to current valid value
      setInputValue(value.toString())
    } else {
      setInputValue(numValue.toString())
      onChange(numValue)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  return (
    <div className="quantity-stepper">
      <button
        type="button"
        className="quantity-stepper__button"
        onClick={handleDecrease}
        disabled={value <= min || disabled}
        aria-label={t.common.decrease}
      >
        −
      </button>
      <input
        key={value}
        type="number"
        className="quantity-stepper__value"
        defaultValue={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={label ?? t.common.quantity}
      />
      <button
        type="button"
        className="quantity-stepper__button"
        onClick={handleIncrease}
        disabled={value >= max || disabled}
        aria-label={t.common.increase}
      >
        +
      </button>
    </div>
  )
}

