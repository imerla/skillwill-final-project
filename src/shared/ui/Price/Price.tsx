import { useLanguage, type Translations } from '../../i18n/LanguageContext'
import { formatPrice } from '../../lib/format'
import './Price.css'

interface PriceProps {
  value: number
  oldValue?: number
  currency?: string
  discountPercent?: number
  size?: 'sm' | 'md' | 'lg'
  t?: Translations
}

export function Price({ value, oldValue, currency = 'GEL', discountPercent, size = 'md', t: propT }: PriceProps) {
  const { t: hookT } = useLanguage()
  const t = propT || hookT
  return (
    <div className={`price price--${size}`}>
      <span className="visually-hidden">{t.common.currentPrice}</span>
      <span className="price__current">{formatPrice(value, currency)}</span>
      {(oldValue !== undefined || discountPercent !== undefined) && (
        <div className="price__details">
          {oldValue !== undefined && (
            <>
              <span className="visually-hidden">{t.common.oldPrice}</span>
              <del className="price__old">{formatPrice(oldValue, currency)}</del>
            </>
          )}
          {discountPercent !== undefined && (
            <span className="price__discount">{t.common.discount(discountPercent)}</span>
          )}
        </div>
      )}
    </div>
  )
}

