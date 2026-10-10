import type { Category } from '../types'
import './CategoryBanner.css'

interface CategoryBannerProps {
  category: Category
}

export function CategoryBanner({ category }: CategoryBannerProps) {
  return (
    <div className="category-banner">
      <div className="category-banner__background">
        <img
          src={category.image}
          alt=""
          className="category-banner__image"
        />
        <div className="category-banner__overlay" />
      </div>
      <div className="category-banner__content">
        <h1 className="category-banner__title">{category.name}</h1>
        {category.description && (
          <p className="category-banner__description">{category.description}</p>
        )}
        <div className="category-banner__meta">
          <span className="category-banner__count">{category.productsCount} პროდუქტი</span>
        </div>
      </div>
    </div>
  )
}
