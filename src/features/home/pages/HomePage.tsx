import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Truck, Shield, Heart } from 'lucide-react'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { ROUTES } from '../../../app/routes'
import './HomePage.css'

export function HomePage() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-page__hero">
        <div className="home-page__hero-content">
          <h1 className="home-page__hero-title">
            თქვენი საყვარელი პროდუქტები
          </h1>
          <p className="home-page__hero-subtitle">
            მაღალი ხარისხი, საუკეთესო ფასები და სწრაფი მიწოდება
          </p>
          <Button onClick={() => window.location.href = ROUTES.catalog} className="home-page__hero-cta">
            კატალოგში გადასვლა
            <ArrowRight size={20} />
          </Button>
        </div>
      </section>

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

      {/* CTA Section */}
      <section className="home-page__cta">
        <PageContainer size="narrow">
          <div className="home-page__cta-content">
            <h2 className="home-page__cta-title">მზად ხართ შოპინგისთვის?</h2>
            <p className="home-page__cta-description">
              მოიძიეთ ჩვენი კატალოგი და იპოვეთ თქვენთვის საუკეთესო პროდუქტები
            </p>
            <Link to={ROUTES.catalog} className="home-page__cta-button">
              კატალოგის ნახვა
            </Link>
          </div>
        </PageContainer>
      </section>
    </div>
  )
}
