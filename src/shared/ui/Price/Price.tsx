import { ka } from '../../i18n/ka'
import { formatPrice } from '../../lib/format'
import './Price.css'

interface PriceProps {
  value: number
  oldValue?: number
  currency?: string
  discountPercent?: number
  size?: 'sm' | 'md' | 'lg'
}

export function Price({ value, oldValue, currency = 'GEL', discountPercent, size = 'md' }: PriceProps) {
  return (
    <div className={`price price--${size}`}>
      <span className="visually-hidden">{ka.common.currentPrice}</span>
      <span className="price__current">{formatPrice(value, currency)}</span>
      {oldValue !== undefined && (
        <>
          <span className="visually-hidden">{ka.common.oldPrice}</span>
          <del className="price__old">{formatPrice(oldValue, currency)}</del>
        </>
      )}
      {discountPercent !== undefined && (
        <span className="price__discount">{ka.common.discount(discountPercent)}</span>
      )}
    </div>
  )
}

