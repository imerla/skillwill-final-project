import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { Price } from '../../../shared/ui/Price/Price'
import { Rating } from '../../../shared/ui/Rating/Rating'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { ka } from '../../../shared/i18n/ka'
import { ROUTES } from '../../../app/routes'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
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
  } = product

  return (
    <Link to={ROUTES.product(slug)} className="product-card">
      <div className="product-card__image">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="product-card__img"
        />
        {!inStock && (
          <Badge variant="danger">
            {ka.catalog.outOfStock}
          </Badge>
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
          <Rating value={rating} count={reviewsCount} />
        )}
      </div>
    </Link>
  )
}

