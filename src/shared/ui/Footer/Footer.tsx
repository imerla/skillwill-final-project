import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { ROUTES } from '../../../app/routes'
import './Footer.css'

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__grid">
          {/* About Section */}
          <div className="footer__section">
            <h3 className="footer__title">{t.nav.brand}</h3>
            <p className="footer__description">
              თქვენი საყვარელი პროდუქტების საიმედო მაღაზია. მაღალი ხარისხი, საუკეთესო ფასები და სწრაფი მიწოდება.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer__section">
            <h3 className="footer__title">სწრაფი ბმულები</h3>
            <ul className="footer__links">
              <li>
                <Link to={ROUTES.catalog} className="footer__link">
                  {t.nav.products}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.orders} className="footer__link">
                  {t.nav.orders}
                </Link>
              </li>
              <li>
                <Link to={ROUTES.profile} className="footer__link">
                  {t.nav.profile}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer__section">
            <h3 className="footer__title">კონტაქტი</h3>
            <ul className="footer__contact">
              <li className="footer__contact-item">
                <Phone size={18} className="footer__icon" />
                <span>+995 555 123 456</span>
              </li>
              <li className="footer__contact-item">
                <Mail size={18} className="footer__icon" />
                <span>info@shop.ge</span>
              </li>
              <li className="footer__contact-item">
                <MapPin size={18} className="footer__icon" />
                <span>თბილისი, რუსთაველის გამზირი 17</span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="footer__section">
            <h3 className="footer__title">სოციალური ქსელები</h3>
            <div className="footer__social">
              <a href="#" className="footer__social-link" aria-label="Facebook">
                <Facebook size={24} />
              </a>
              <a href="#" className="footer__social-link" aria-label="Instagram">
                <Instagram size={24} />
              </a>
              <a href="#" className="footer__social-link" aria-label="YouTube">
                <Youtube size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © {new Date().getFullYear()} {t.nav.brand}. ყველა უფლება დაცულია.
          </p>
        </div>
      </div>
    </footer>
  )
}
