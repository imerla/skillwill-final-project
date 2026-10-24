import type { CategoryFilter } from '../types'
import { Button } from '../../../shared/ui/Button/Button'
import { Checkbox } from '../../../shared/ui/Checkbox/Checkbox'
import { Radio } from '../../../shared/ui/Radio/Radio'
import { Input } from '../../../shared/ui/Input/Input'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { translateFilterLabel, translateFilterOption } from '../../../shared/i18n/apiTranslations'
import './Filter.css'

interface FilterProps {
  filter: CategoryFilter
  selectedValues: string
  onChange: (key: string, value: string) => void
  onClear: (key: string) => void
  minValue?: number
  maxValue?: number
  onRangeChange?: (min?: number, max?: number) => void
}

export function Filter({ filter, selectedValues, onChange, onClear, minValue, maxValue, onRangeChange }: FilterProps) {
  const { t } = useLanguage()
  const selectedSet = new Set(selectedValues.split(',').filter(Boolean))

  const translatedLabel = translateFilterLabel(filter.label, t)

  const isPriceFilter = filter.key === 'price'

  const handleCheckboxChange = (value: string, checked: boolean) => {
    const newSet = new Set(selectedSet)
    if (checked) {
      newSet.add(value)
    } else {
      newSet.delete(value)
    }
    onChange(filter.key, Array.from(newSet).join(','))
  }

  const handleRadioChange = (value: string) => {
    onChange(filter.key, value)
  }

  const handleColorChange = (value: string, checked: boolean) => {
    const newSet = new Set(selectedSet)
    if (checked) {
      newSet.add(value)
    } else {
      newSet.delete(value)
    }
    onChange(filter.key, Array.from(newSet).join(','))
  }

  const handleRangeChange = (min?: number, max?: number) => {
    const parts: string[] = []
    if (min !== undefined) parts.push(`min:${min}`)
    if (max !== undefined) parts.push(`max:${max}`)
    onChange(filter.key, parts.join(','))
  }

  const hasSelection = isPriceFilter ? (minValue !== undefined || maxValue !== undefined) : selectedSet.size > 0

  return (
    <fieldset className="filter">
      <legend className="filter__legend">
        {translatedLabel}
        {hasSelection && (
          <Button
            variant="secondary"
            onClick={() => onClear(filter.key)}
            aria-label={t.catalog.clearFilterAria(translatedLabel)}
            className="filter__clear"
          >
            {t.catalog.clear}
          </Button>
        )}
      </legend>

      {filter.type === 'checkbox' && filter.options && (
        <div className="filter__options">
          {filter.options.map((option) => (
            <Checkbox
              key={option.value}
              label={translateFilterOption(option.label, t)}
              count={option.count}
              checked={selectedSet.has(option.value)}
              onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
            />
          ))}
        </div>
      )}

      {filter.type === 'radio' && filter.options && (
        <div className="filter__options">
          {filter.options.map((option) => (
            <Radio
              key={option.value}
              name={filter.key}
              label={translateFilterOption(option.label, t)}
              count={option.count}
              checked={selectedValues === option.value}
              onChange={() => handleRadioChange(option.value)}
            />
          ))}
        </div>
      )}

      {filter.type === 'color' && filter.options && (
        <div className="filter__colors">
          {filter.options.map((option) => (
            <label key={option.value} className="filter__color-option">
              <input
                type="checkbox"
                checked={selectedSet.has(option.value)}
                onChange={(e) => handleColorChange(option.value, e.target.checked)}
                className="filter__color-checkbox"
                aria-label={translateFilterOption(option.label, t)}
              />
              <span
                className="filter__color-swatch"
                style={{ backgroundColor: option.value }}
                aria-hidden="true"
              />
              <span className="filter__color-label">{translateFilterOption(option.label, t)}</span>
            </label>
          ))}
        </div>
      )}

      {filter.type === 'range' && (
        <div className="filter__range">
          <div className="filter__range-inputs">
            <div className="filter__range-field">
              <label htmlFor={`${filter.key}-min`} className="filter__range-label">
                {t.catalog.min}
              </label>
              <Input
                id={`${filter.key}-min`}
                type="number"
                min={filter.min}
                max={filter.max}
                placeholder={filter.min?.toString()}
                className="filter__range-input"
                value={isPriceFilter ? (minValue ?? '') : ''}
                onChange={(e) => {
                  const min = e.target.value ? Number(e.target.value) : undefined
                  if (isPriceFilter && onRangeChange) {
                    onRangeChange(min, maxValue)
                  } else {
                    const currentParts = selectedValues.split(',').filter(Boolean)
                    const maxPart = currentParts.find((p) => p.startsWith('max:'))
                    const max = maxPart ? Number(maxPart.replace('max:', '')) : undefined
                    handleRangeChange(min, max)
                  }
                }}
              />
              {filter.unit && <span className="filter__range-unit">{filter.unit}</span>}
            </div>
            <div className="filter__range-field">
              <label htmlFor={`${filter.key}-max`} className="filter__range-label">
                {t.catalog.max}
              </label>
              <Input
                id={`${filter.key}-max`}
                type="number"
                min={filter.min}
                max={filter.max}
                placeholder={filter.max?.toString()}
                className="filter__range-input"
                value={isPriceFilter ? (maxValue ?? '') : ''}
                onChange={(e) => {
                  const max = e.target.value ? Number(e.target.value) : undefined
                  if (isPriceFilter && onRangeChange) {
                    onRangeChange(minValue, max)
                  } else {
                    const currentParts = selectedValues.split(',').filter(Boolean)
                    const minPart = currentParts.find((p) => p.startsWith('min:'))
                    const min = minPart ? Number(minPart.replace('min:', '')) : undefined
                    handleRangeChange(min, max)
                  }
                }}
              />
              {filter.unit && <span className="filter__range-unit">{filter.unit}</span>}
            </div>
          </div>
        </div>
      )}
    </fieldset>
  )
}

