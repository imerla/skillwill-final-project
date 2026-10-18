import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import type { Product } from '../types'
import { Price } from '../../../shared/ui/Price/Price'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { useLanguage, type Translations } from '../../../shared/i18n/LanguageContext'
import { ROUTES } from '../../../app/routes'
import { useFavorites, useAddToFavorites, useRemoveFromFavorites } from '../../favorites/hooks'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
  onQuickAdd?: (product: Product) => void
  t?: Translations
}

export function ProductCard({ product, onQuickAdd, t: propT }: ProductCardProps) {
  const { t: hookT } = useLanguage()
  const t = propT || hookT
  const {
    id,
    slug,
    title,
    brand,
    price,
    oldPrice,
    discountPercent,
    currency,
    rating,
    reviewsCount,
    inStock,
    image,
    images,
  } = product

  const [isHovered, setIsHovered] = useState(false)
  const currentImage = isHovered && images && images.length > 1 ? images[1] : image

  const { data: favorites } = useFavorites()
  const addToFavorites = useAddToFavorites()
  const removeFromFavorites = useRemoveFromFavorites()

  // Check localStorage as fallback for when API fails
  const getStoredFavoriteIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem('favorites_ids')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  }

  const isFavorite = favorites?.items.some((f) => f.productId === id) ?? getStoredFavoriteIds().has(id)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickAdd?.(product)
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isFavorite) {
      removeFromFavorites.mutate(id)
    } else {
      addToFavorites.mutate(id)
    }
  }

  return (
    <Link
      to={ROUTES.product(slug)}
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-card__image">
        <img
          src={currentImage}
          alt={title}
          loading="lazy"
          className="product-card__img"
        />
        {discountPercent && discountPercent > 0 && (
          <div className="product-card__discount-badge">
            -{discountPercent}%
          </div>
        )}
        {!inStock && (
          <Badge variant="danger" className="product-card__stock-badge">
            {t.catalog.outOfStock}
          </Badge>
        )}
        {inStock && onQuickAdd && (
          <button
            className="product-card__quick-add"
            onClick={handleQuickAdd}
            aria-label={t.product.addToCart}
          >
            <ShoppingCart size={18} />
          </button>
        )}
        <button
          className={`product-card__favorite ${isFavorite ? 'product-card__favorite--active' : ''}`}
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? t.product.removeFromFavorites : t.product.addToFavorites}
        >
          <Heart size={18} fill={isFavorite ? 'var(--color-primary)' : 'none'} />
        </button>
      </div>

      <div className="product-card__content">
        <p className="product-card__brand">{brand}</p>
        <h3 className="product-card__title">{title}</h3>

        <Price
          value={price}
          oldValue={oldPrice ?? undefined}
          discountPercent={discountPercent ?? undefined}
          currency={currency}
          size="lg"
          t={t}
        />

        {rating > 0 && (
          <div className="product-card__rating">
            <Star size={14} className="product-card__star-icon" fill="#ff7a00" />
            <span className="product-card__rating-value">{rating.toFixed(1)}</span>
            <span className="product-card__reviews-count">{t.catalog.reviews(reviewsCount)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

