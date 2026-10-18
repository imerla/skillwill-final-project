import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { HeroBanner } from '../../../shared/ui/HeroBanner/HeroBanner'
import { Target, Users, Award, Globe } from 'lucide-react'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import './AboutUsPage.css'

export function AboutUsPage() {
  const { t } = useLanguage()
  return (
    <div className="about-page">
      {/* Hero Section */}
      <PageContainer size="page" as="section">
        <HeroBanner
          title={t.about.heroTitle}
          subtitle={t.about.heroSubtitle}
          image="https://images.unsplash.com/photo-1553614186-a373dedbb390?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
          height="medium"
        />
      </PageContainer>

      {/* Mission Section */}
      <PageContainer size="page" as="section">
        <div className="about-page__mission">
          <div className="about-page__mission-content">
            <h2 className="about-page__section-title">{t.about.missionTitle}</h2>
            <p className="about-page__section-text">
              {t.about.missionText}
            </p>
          </div>
        </div>
      </PageContainer>

      {/* Values Section */}
      <PageContainer size="page" as="section">
        <div className="about-page__values">
          <h2 className="about-page__section-title">{t.about.valuesTitle}</h2>
          <div className="about-page__values-grid">
            <div className="about-page__value-card">
              <div className="about-page__value-icon">
                <Target size={32} />
              </div>
              <h3 className="about-page__value-title">{t.about.valueQualityTitle}</h3>
              <p className="about-page__value-description">
                {t.about.valueQualityDesc}
              </p>
            </div>
            <div className="about-page__value-card">
              <div className="about-page__value-icon">
                <Users size={32} />
              </div>
              <h3 className="about-page__value-title">{t.about.valueCustomerTitle}</h3>
              <p className="about-page__value-description">
                {t.about.valueCustomerDesc}
              </p>
            </div>
            <div className="about-page__value-card">
              <div className="about-page__value-icon">
                <Award size={32} />
              </div>
              <h3 className="about-page__value-title">{t.about.valueInnovationTitle}</h3>
              <p className="about-page__value-description">
                {t.about.valueInnovationDesc}
              </p>
            </div>
            <div className="about-page__value-card">
              <div className="about-page__value-icon">
                <Globe size={32} />
              </div>
              <h3 className="about-page__value-title">{t.about.valueDeliveryTitle}</h3>
              <p className="about-page__value-description">
                {t.about.valueDeliveryDesc}
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
              <div className="about-page__stat-number">500+</div>
              <div className="about-page__stat-label">{t.about.statProducts}</div>
            </div>
            <div className="about-page__stat">
              <div className="about-page__stat-number">10000+</div>
              <div className="about-page__stat-label">{t.about.statCustomers}</div>
            </div>
            <div className="about-page__stat">
              <div className="about-page__stat-number">5</div>
              <div className="about-page__stat-label">{t.about.statYears}</div>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  )
}
