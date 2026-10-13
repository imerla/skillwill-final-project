import { useState } from 'react'
import { ka } from '../../i18n/ka'
import './QuantityStepper.css'

interface QuantityStepperProps {
  value: number
  onChange(value: number): void
  min?: number
  max?: number
  disabled?: boolean
  label?: string
}

export function QuantityStepper({ value, onChange, min = 1, max = 999, disabled = false, label }: QuantityStepperProps) {
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
      setInputValue(max.toString())
      onChange(max)
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
        aria-label={ka.common.decrease}
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
        aria-label={label ?? ka.common.quantity}
      />
      <button
        type="button"
        className="quantity-stepper__button"
        onClick={handleIncrease}
        disabled={value >= max || disabled}
        aria-label={ka.common.increase}
      >
        +
      </button>
    </div>
  )
}

