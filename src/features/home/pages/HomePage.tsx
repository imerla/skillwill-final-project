import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Truck, Shield, Heart, Star, TrendingUp } from 'lucide-react'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { HeroBanner } from '../../../shared/ui/HeroBanner/HeroBanner'
import { Button } from '../../../shared/ui/Button/Button'
import { ProductCard } from '../../../features/catalog/components/ProductCard'
import { ROUTES } from '../../../app/routes'
import { useProducts } from '../../../features/catalog/hooks'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import './HomePage.css'

export function HomePage() {
  const { data: popularProducts, isLoading: popularLoading } = useProducts({ sort: 'popular', limit: 4 })
  const { data: topRatedProducts, isLoading: topRatedLoading } = useProducts({ sort: 'rating-desc', limit: 4 })

  const popularLink = `${ROUTES.catalog}?sort=popular`
  const topRatedLink = `${ROUTES.catalog}?sort=rating-desc`

  return (
    <div className="home-page">
      {/* Hero Section */}
      <PageContainer size="page" as="section">
        <HeroBanner
          title="თქვენი საყვარელი პროდუქტები"
          subtitle="მაღალი ხარისხი, საუკეთესო ფასები და სწრაფი მიწოდება"
          image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80"
          height="large"
        >
          <Button onClick={() => window.location.href = ROUTES.catalog} className="home-page__hero-cta">
            კატალოგში გადასვლა
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
            <h3 className="home-page__feature-title">ფართო არჩევანი</h3>
            <p className="home-page__feature-description">
              ათასობით პროდუქტი ყველა გემოვნებისთვის
            </p>
          </div>
          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <Truck size={32} />
            </div>
            <h3 className="home-page__feature-title">სწრაფი მიწოდება</h3>
            <p className="home-page__feature-description">
              მიწოდება მთელ საქართველოში 1-3 დღეში
            </p>
          </div>
          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <Shield size={32} />
            </div>
            <h3 className="home-page__feature-title">ხარისხის გარანტია</h3>
            <p className="home-page__feature-description">
              მხოლოდ ორიგინალური პროდუქტები
            </p>
          </div>
          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <Heart size={32} />
            </div>
            <h3 className="home-page__feature-title">მომხმარებლის მხარდაჭერა</h3>
            <p className="home-page__feature-description">
              24/7 დახმარება ყველა კითხვაზე
            </p>
          </div>
        </div>
      </PageContainer>

      {/* Popular Products Section */}
      <PageContainer size="page" as="section">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">
            <TrendingUp size={24} />
            პოპულარული პროდუქტები
          </h2>
          <Link to={popularLink} className="home-page__section-link">
            ყველას ნახვა
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="home-page__products-grid">
          {popularLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="home-page__product-skeleton">
                  <Skeleton variant="rect" className="home-page__product-skeleton-image" />
                  <Skeleton variant="rect" className="home-page__product-skeleton-title" />
                  <Skeleton variant="rect" className="home-page__product-skeleton-price" />
                </div>
              ))
            : popularProducts?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </PageContainer>

      {/* Top Rated Products Section */}
      <PageContainer size="page" as="section">
        <div className="home-page__section-header">
          <h2 className="home-page__section-title">
            <Star size={24} />
            საუკეთესო შეფასებული
          </h2>
          <Link to={topRatedLink} className="home-page__section-link">
            ყველას ნახვა
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="home-page__products-grid">
          {topRatedLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="home-page__product-skeleton">
                  <Skeleton variant="rect" className="home-page__product-skeleton-image" />
                  <Skeleton variant="rect" className="home-page__product-skeleton-title" />
                  <Skeleton variant="rect" className="home-page__product-skeleton-price" />
                </div>
              ))
            : topRatedProducts?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </PageContainer>
    </div>
  )
}
