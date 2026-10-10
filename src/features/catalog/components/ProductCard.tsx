import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import type { Product } from '../types'
import { Price } from '../../../shared/ui/Price/Price'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { ka } from '../../../shared/i18n/ka'
import { ROUTES } from '../../../app/routes'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
  onQuickAdd?: (product: Product) => void
}

export function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const {
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

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickAdd?.(product)
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
            {ka.catalog.outOfStock}
          </Badge>
        )}
        {inStock && onQuickAdd && (
          <button
            className="product-card__quick-add"
            onClick={handleQuickAdd}
            aria-label={ka.product.addToCart}
          >
            <ShoppingCart size={18} />
          </button>
        )}
      </div>

      <div className="product-card__content">
        <p className="product-card__brand">{brand}</p>
        <h3 className="product-card__title">{title}</h3>

        <Price
          value={price}
          oldValue={oldPrice ?? undefined}
          discountPercent={discountPercent ?? undefined}
          currency={currency}
          size="sm"
        />

        {rating > 0 && (
          <div className="product-card__rating">
            <Star size={14} className="product-card__star-icon" fill="#ff7a00" />
            <span className="product-card__rating-value">{rating.toFixed(1)}</span>
            <span className="product-card__reviews-count">({reviewsCount})</span>
          </div>
        )}
      </div>
    </Link>
  )
}

