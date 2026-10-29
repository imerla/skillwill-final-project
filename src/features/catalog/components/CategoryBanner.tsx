import type { Category } from '../types'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { translateCategoryName, translateCategoryDescription } from '../../../shared/i18n/apiTranslations'
import './CategoryBanner.css'

interface CategoryBannerProps {
  category: Category
}

export function CategoryBanner({ category }: CategoryBannerProps) {
  const { t } = useLanguage()
  return (
    <div className="category-banner">
      <div className="category-banner__background">
        <img
          src={category.image}
          alt=""
          className="category-banner__image"
          width={1200}
          height={500}
          fetchPriority="high"
        />
        <div className="category-banner__overlay" />
      </div>
      <div className="category-banner__content">
        <h1 className="category-banner__title">{translateCategoryName(category.name, t)}</h1>
        {category.description && (
          <p className="category-banner__description">{translateCategoryDescription(category.description, t)}</p>
        )}
        <div className="category-banner__meta">
          <span className="category-banner__count">{t.catalog.productCount(category.productsCount)}</span>
        </div>
      </div>
    </div>
  )
}
