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

export function QuantityStepper({ value, onChange, min = 1, max = 99, disabled = false, label }: QuantityStepperProps) {
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
      <output
        className="quantity-stepper__value"
        aria-live="polite"
        aria-label={label ?? ka.common.quantity}
      >
        {value}
      </output>
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

