import { ka } from '../../i18n/ka'
import './Rating.css'

interface RatingProps {
  value: number
  count?: number
}

export function Rating({ value, count }: RatingProps) {
  return (
    <div className="rating" aria-label={ka.common.ratingOf(value)}>
      <span className="rating__star" aria-hidden="true">★</span>
      <span className="rating__value" aria-hidden="true">{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="rating__count" aria-hidden="true">{ka.catalog.reviews(count)}</span>
      )}
    </div>
  )
}

