import { useLanguage } from '../../i18n/LanguageContext'
import './Rating.css'

interface RatingProps {
  value: number
  count?: number
}

export function Rating({ value, count }: RatingProps) {
  const { t } = useLanguage()
  return (
    <div className="rating" aria-label={t.common.ratingOf(value)}>
      <span className="rating__star" aria-hidden="true">★</span>
      <span className="rating__value" aria-hidden="true">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="rating__count" aria-hidden="true">{t.catalog.reviews(count)}</span>
      )}
    </div>
  )
}

