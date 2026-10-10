import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Target, Users, Award, Globe } from 'lucide-react'
import './AboutUsPage.css'

export function AboutUsPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-page__hero">
        <PageContainer size="narrow">
          <h1 className="about-page__hero-title">ჩვენს შესახებ</h1>
          <p className="about-page__hero-subtitle">
            ჩვენ ვართ თქვენი საყვარელი პროდუქტების საიმედო მაღაზია
          </p>
        </PageContainer>
      </section>

      {/* Mission Section */}
      <PageContainer size="page" as="section">
        <div className="about-page__mission">
          <div className="about-page__mission-content">
            <h2 className="about-page__section-title">ჩვენი მისია</h2>
            <p className="about-page__section-text">
              ჩვენი მისიაა მომხმარებლებს მივაწოდოთ მაღალი ხარისხის პროდუქტები საუკეთესო ფასებში. ჩვენ ვისწრავთ სიახლეს, ვაფასებთ ხარისხს და ვქმნით საუკეთესო საყიდლო გამოცდას.
            </p>
          </div>
        </div>
      </PageContainer>

      {/* Values Section */}
      <PageContainer size="page" as="section">
        <div className="about-page__values">
          <h2 className="about-page__section-title">ჩვენი ფასები</h2>
          <div className="about-page__values-grid">
            <div className="about-page__value-card">
              <div className="about-page__value-icon">
                <Target size={32} />
              </div>
              <h3 className="about-page__value-title">ხარისხი</h3>
              <p className="about-page__value-description">
                მხოლოდ ორიგინალური პროდუქტები სერთიფიკატებით
              </p>
            </div>
            <div className="about-page__value-card">
              <div className="about-page__value-icon">
                <Users size={32} />
              </div>
              <h3 className="about-page__value-title">მომხმარებელზე ორიენტირება</h3>
              <p className="about-page__value-description">
                თითოეული მომხმარებლის კმაყოფილება ჩვენთვის პირველ პრიორიტეტი
              </p>
            </div>
            <div className="about-page__value-card">
              <div className="about-page__value-icon">
                <Award size={32} />
              </div>
              <h3 className="about-page__value-title">სიახლე</h3>
              <p className="about-page__value-description">
                მუდმივად ვახალებთ ჩვენს ასორტიმენტს ახალი პროდუქტებით
              </p>
            </div>
            <div className="about-page__value-card">
              <div className="about-page__value-icon">
                <Globe size={32} />
              </div>
              <h3 className="about-page__value-title">მთელ საქართველოში</h3>
              <p className="about-page__value-description">
                სწრაფი მიწოდება ქვეყნის ნებისმიერ კუთხეში
              </p>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Stats Section */}
      <section className="about-page__stats">
        <PageContainer size="page">
          <div className="about-page__stats-grid">
            <div className="about-page__stat">
              <div className="about-page__stat-number">5000+</div>
              <div className="about-page__stat-label">პროდუქტი</div>
            </div>
            <div className="about-page__stat">
              <div className="about-page__stat-number">10000+</div>
              <div className="about-page__stat-label">მომხმარებელი</div>
            </div>
            <div className="about-page__stat">
              <div className="about-page__stat-number">5</div>
              <div className="about-page__stat-label">წელი ბაზარზე</div>
            </div>
            <div className="about-page__stat">
              <div className="about-page__stat-number">24/7</div>
              <div className="about-page__stat-label">მხარდაჭერა</div>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  )
}
