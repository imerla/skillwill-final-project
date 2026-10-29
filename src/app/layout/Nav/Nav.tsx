import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Menu, X, Home, ShoppingBag, ShoppingCart, Package, User, LogIn, UserPlus, LogOut, Info, Heart } from 'lucide-react'
import { useSession } from '../../../shared/auth'
import { useCart } from '../../../features/cart/hooks'
import { useOrders } from '../../../features/orders/hooks'
import { useFavorites } from '../../../features/favorites/hooks'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { Input } from '../../../shared/ui/Input/Input'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { ROUTES } from '../../routes'
import './Nav.css'

export function Nav() {
  const { isAuthenticated, isLoading, logout } = useSession()
  const { data: cart } = useCart()
  const { data: orders } = useOrders({ enabled: isAuthenticated })
  const { data: favorites } = useFavorites()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const totalQty = cart?.totalQty || 0
  const ordersCount = orders?.items?.length || 0
  const favoritesCount = favorites?.total || 0
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isCatalogPage = location.pathname === ROUTES.catalog
  const searchQuery = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(searchQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Use a ref to avoid feedback loop: only update if URL changed, not if we caused it
  const lastCommittedRef = useRef(searchQuery)
  useEffect(() => {
    if (searchQuery !== lastCommittedRef.current) {
      lastCommittedRef.current = searchQuery
      setSearchInput(searchQuery)
    }
  }, [searchQuery])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const trimmed = value.trim()
      lastCommittedRef.current = trimmed
      const newParams = new URLSearchParams(searchParams)
      if (trimmed) {
        newParams.set('q', trimmed)
      } else {
        newParams.delete('q')
      }
      newParams.delete('page')
      setSearchParams(newParams)
    }, 400)
  }

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('nav__menu-open')
    } else {
      document.body.classList.remove('nav__menu-open')
    }

    return () => {
      document.body.classList.remove('nav__menu-open')
    }
  }, [isMobileMenuOpen])

  const handleLogout = () => {
    logout()
    navigate(ROUTES.login, { replace: true })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className={`nav ${isMobileMenuOpen ? 'nav--menu-open' : ''}`}>
      <nav aria-label={t.nav.primaryNav}>
        <div className="nav__container">
          <button
            type="button"
            className="nav__brand"
            onClick={() => navigate(ROUTES.home)}
            aria-label={t.nav.brand}
          >
            <img
              src="/image_75788823.webp"
              srcSet="/image_75788823.webp 50w"
              sizes="50px"
              alt={t.nav.brand}
              className="nav__logo"
              width={50}
              height={75}
              loading="eager"
            />
          </button>

          {/* Search input - only show on catalog page */}
          {isCatalogPage && (
            <div className="nav__search">
              <Input
                type="search"
                placeholder={t.catalog.searchPlaceholder}
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label={t.catalog.searchLabel}
                className="nav__search-input"
              />
            </div>
          )}

          {/* New common Div for mobile language and burger */}
          <div className="nav__mobile-actions">
            <button
              type="button"
              className="nav__link nav__link--language nav__language-switcher-mobile"
              onClick={() => setLanguage(language === 'ka' ? 'en' : 'ka')}
              aria-label={t.common.switchLanguage}
            >
              <img
                src={language === 'ka' ? '/flags/ge.svg' : '/flags/gb.svg'}
                alt={language === 'ka' ? 'Georgian' : 'English'}
                className="nav__language-flag"
                width={24}
                height={16}
              />
            </button>

            <button
              type="button"
              className="nav__burger"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? t.nav.closeMenu : t.nav.menu}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div
            className={`nav__overlay ${isMobileMenuOpen ? 'nav__overlay--open' : ''}`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          <div className="nav__nav-items">
            <div className={`nav__links ${isMobileMenuOpen ? 'nav__links--open' : ''}`}>
            <NavLink to={ROUTES.home} className="nav__link nav__link--with-text" onClick={closeMobileMenu}>
              <Home size={18} className="nav__link-icon" />
              <span>{t.nav.brand}</span>
            </NavLink>
            <NavLink to={ROUTES.catalog} className="nav__link nav__link--with-text" onClick={closeMobileMenu}>
              <ShoppingBag size={18} className="nav__link-icon" />
              <span>{t.nav.products}</span>
            </NavLink>
            <NavLink to={ROUTES.about} className="nav__link nav__link--with-text" onClick={closeMobileMenu}>
              <Info size={18} className="nav__link-icon" />
              <span>{t.nav.about}</span>
            </NavLink>
            <NavLink to={ROUTES.favorites} className="nav__link" onClick={closeMobileMenu}>
                  <Heart size={18} className="nav__link-icon" />
                  <span>{t.nav.favorites}</span>
                  {favoritesCount > 0 && (
                    <Badge variant="accent">{favoritesCount}</Badge>
                  )}
            </NavLink>
            <NavLink
              to={ROUTES.cart}
              className="nav__link"
              aria-label={isAuthenticated && totalQty > 0 ? t.nav.cartCount(totalQty) : undefined}
              onClick={closeMobileMenu}
            >
              <ShoppingCart size={18} className="nav__link-icon" />
              <span>{t.nav.cart}</span>
              {isAuthenticated && totalQty > 0 && (
                <Badge variant="accent">{totalQty}</Badge>
              )}
            </NavLink>
            {isLoading ? (
              <>
                <Skeleton variant="rect" className="nav__skeleton" />
                <Skeleton variant="rect" className="nav__skeleton" />
              </>
            ) : isAuthenticated ? (
              <>
                <NavLink to={ROUTES.orders} className="nav__link" onClick={closeMobileMenu}>
                  <Package size={18} className="nav__link-icon" />
                  <span>{t.nav.orders}</span>
                  {ordersCount > 0 && (
                    <Badge variant="accent">{ordersCount}</Badge>
                  )}
                </NavLink>
                <NavLink to={ROUTES.profile} className="nav__link" onClick={closeMobileMenu}>
                  <User size={18} className="nav__link-icon" />
                  <span>{t.nav.profile}</span>
                </NavLink>
                {/* Language switcher - desktop */}
                <button
                  type="button"
                  className="nav__link nav__link--language nav__language-switcher-desktop"
                  onClick={() => setLanguage(language === 'ka' ? 'en' : 'ka')}
                  aria-label={t.common.switchLanguage}
                >
                  <img
                    src={language === 'ka' ? '/flags/ge.svg' : '/flags/gb.svg'}
                    alt={language === 'ka' ? 'Georgian' : 'English'}
                    className="nav__language-flag"
                    width={24}
                    height={16}
                  />
                  <span className="nav__language-text">{language === 'ka' ? 'EN' : 'KA'}</span>
                </button>
                <button type="button" className="nav__button nav__button--with-text" onClick={handleLogout}>
                  <LogOut size={18} className="nav__button-icon" />
                  <span>{t.nav.logout}</span>
                </button>
              </>
            ) : (
              <>
                <NavLink to={ROUTES.login} className="nav__link" onClick={closeMobileMenu}>
                  <LogIn size={18} className="nav__link-icon" />
                  <span>{t.nav.login}</span>
                </NavLink>
                <NavLink to={ROUTES.register} className="nav__link" onClick={closeMobileMenu}>
                  <UserPlus size={18} className="nav__link-icon" />
                  <span>{t.nav.register}</span>
                </NavLink>
                {/* Language switcher - desktop */}
                <button
                  type="button"
                  className="nav__link nav__link--language nav__language-switcher-desktop"
                  onClick={() => setLanguage(language === 'ka' ? 'en' : 'ka')}
                  aria-label={t.common.switchLanguage}
                >
                  <img
                    src={language === 'ka' ? '/flags/ge.svg' : '/flags/gb.svg'}
                    alt={language === 'ka' ? 'Georgian' : 'English'}
                    className="nav__language-flag"
                    width={24}
                    height={16}
                  />
                  <span className="nav__language-text">{language === 'ka' ? 'EN' : 'KA'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  </header>
  )
}

