import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Truck, Shield, Heart, Star, TrendingUp } from 'lucide-react'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { HeroBanner } from '../../../shared/ui/HeroBanner/HeroBanner'
import { Button } from '../../../shared/ui/Button/Button'
import { ProductCard } from '../../../features/catalog/components/ProductCard'
import { Carousel } from '../../../shared/ui/Carousel/Carousel'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { ROUTES } from '../../../app/routes'
import { useProducts } from '../../../features/catalog/hooks'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import './HomePage.css'

export function HomePage() {
  const { t } = useLanguage()
  const { data: popularProducts, isLoading: popularLoading } = useProducts({ sort: 'popular', limit: 8 })
  const { data: topRatedProducts, isLoading: topRatedLoading } = useProducts({ sort: 'rating-desc', limit: 8 })

  const popularLink = `${ROUTES.catalog}?sort=popular`
  const topRatedLink = `${ROUTES.catalog}?sort=rating-desc`

  return (
    <div className="home-page">
      {/* Hero Section */}
      <PageContainer size="page" as="section">
        <HeroBanner
          title={t.home.heroTitle}
          subtitle={t.home.heroSubtitle}
          image="https://images.unsplash.com/photo-1764779169349-a5adca68947c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
          height="large"
        >
          <Button onClick={() => window.location.href = ROUTES.catalog} className="home-page__hero-cta">
            {t.home.heroCta}
            <ArrowRight size={20} />
          </Button>
        </HeroBanner>
      </PageContainer>

      {/* Features Section */}
      <PageContainer size="page" as="section">
        <div className="home-page__features">
          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <ShoppingBag size={32} />
            </div>
            <h3 className="home-page__feature-title">{t.home.featureVarietyTitle}</h3>
            <p className="home-page__feature-description">
              {t.home.featureVarietyDesc}
            </p>
          </div>
          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <Truck size={32} />
            </div>
            <h3 className="home-page__feature-title">{t.home.featureShippingTitle}</h3>
            <p className="home-page__feature-description">
              {t.home.featureShippingDesc}
            </p>
          </div>
          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <Shield size={32} />
            </div>
            <h3 className="home-page__feature-title">{t.home.featureQualityTitle}</h3>
            <p className="home-page__feature-description">
              {t.home.featureQualityDesc}
            </p>
          </div>
          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <Heart size={32} />
            </div>
            <h3 className="home-page__feature-title">{t.home.featureSupportTitle}</h3>
            <p className="home-page__feature-description">
              {t.home.featureSupportDesc}
            </p>
          </div>
        </div>
      </PageContainer>

      {/* Popular Products Section */}
      <PageContainer size="page" as="section">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">
            <TrendingUp size={24} />
            {t.home.popularTitle}
          </h2>
          <Link to={popularLink} className="home-page__section-link">
            {t.home.popularLink}
            <ArrowRight size={16} />
          </Link>
        </div>
        <Carousel itemsPerView={4} gap={24}>
          {popularLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="home-page__product-skeleton">
                  <Skeleton variant="rect" className="home-page__product-skeleton-image" />
                  <Skeleton variant="rect" className="home-page__product-skeleton-title" />
                  <Skeleton variant="rect" className="home-page__product-skeleton-price" />
                </div>
              ))
            : popularProducts?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </Carousel>
      </PageContainer>

      {/* Top Rated Products Section */}
      <PageContainer size="page" as="section">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">
            <Star size={24} />
            {t.home.topRatedTitle}
          </h2>
          <Link to={topRatedLink} className="home-page__section-link">
            {t.home.topRatedLink}
            <ArrowRight size={16} />
          </Link>
        </div>
        <Carousel itemsPerView={4} gap={24}>
          {topRatedLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="home-page__product-skeleton">
                  <Skeleton variant="rect" className="home-page__product-skeleton-image" />
                  <Skeleton variant="rect" className="home-page__product-skeleton-title" />
                  <Skeleton variant="rect" className="home-page__product-skeleton-price" />
                </div>
              ))
            : topRatedProducts?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </Carousel>
      </PageContainer>
    </div>
  )
}
