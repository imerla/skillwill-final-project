import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Menu, X, Home, ShoppingBag, ShoppingCart, Package, User, LogIn, UserPlus, LogOut, Info } from 'lucide-react'
import { useSession } from '../../../shared/auth'
import { useCart } from '../../../features/cart/hooks'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { Input } from '../../../shared/ui/Input/Input'
import { ka } from '../../../shared/i18n/ka'
import { ROUTES } from '../../routes'
import './Nav.css'

export function Nav() {
  const { isAuthenticated, isLoading, logout } = useSession()
  const { data: cart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const totalQty = cart?.totalQty || 0
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Search functionality - only show on catalog page
  const isCatalogPage = location.pathname === ROUTES.catalog
  const searchQuery = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(searchQuery)
  const isUserTypingRef = useRef(false)

  // Sync search input with URL params when not typing
  useEffect(() => {
    if (!isUserTypingRef.current) {
      setSearchInput(searchQuery)
    }
  }, [searchQuery])

  // Debounced search update
  useEffect(() => {
    if (!isCatalogPage) return
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        const newParams = new URLSearchParams(searchParams)
        if (searchInput) {
          newParams.set('q', searchInput)
        } else {
          newParams.delete('q')
        }
        newParams.delete('page') // Reset to page 1 on search
        setSearchParams(newParams)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, searchQuery, searchParams, setSearchParams, isCatalogPage])

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
      <nav aria-label={ka.nav.primaryNav}>
        <div className="nav__container">
          <button
            type="button"
            className="nav__brand"
            onClick={() => navigate(ROUTES.home)}
            aria-label={ka.nav.brand}
          >
            <img src="/image_75788823.png" alt={ka.nav.brand} className="nav__logo" />
          </button>

          {/* Search input - only show on catalog page */}
          {isCatalogPage && (
            <div className="nav__search">
              <Input
                type="search"
                placeholder={ka.catalog.searchPlaceholder}
                value={searchInput}
                onChange={(e) => {
                  isUserTypingRef.current = true
                  setSearchInput(e.target.value)
                }}
                aria-label={ka.catalog.searchLabel}
                className="nav__search-input"
              />
            </div>
          )}

          <button
            type="button"
            className="nav__burger"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? ka.nav.closeMenu : ka.nav.menu}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div
            className={`nav__overlay ${isMobileMenuOpen ? 'nav__overlay--open' : ''}`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          <div className={`nav__links ${isMobileMenuOpen ? 'nav__links--open' : ''}`}>
            <NavLink to={ROUTES.home} className="nav__link" onClick={closeMobileMenu}>
              <Home size={18} className="nav__link-icon" />
              <span>მთავარი</span>
            </NavLink>
            <NavLink to={ROUTES.catalog} className="nav__link" onClick={closeMobileMenu}>
              <ShoppingBag size={18} className="nav__link-icon" />
              <span>{ka.nav.products}</span>
            </NavLink>
            <NavLink to={ROUTES.about} className="nav__link" onClick={closeMobileMenu}>
              <Info size={18} className="nav__link-icon" />
              <span>ჩვენს შესახებ</span>
            </NavLink>
            <NavLink
              to={ROUTES.cart}
              className="nav__link"
              aria-label={isAuthenticated && totalQty > 0 ? ka.nav.cartCount(totalQty) : undefined}
              onClick={closeMobileMenu}
            >
              <ShoppingCart size={18} className="nav__link-icon" />
              <span>{ka.nav.cart}</span>
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
                  <span>{ka.nav.orders}</span>
                </NavLink>
                <NavLink to={ROUTES.profile} className="nav__link" onClick={closeMobileMenu}>
                  <User size={18} className="nav__link-icon" />
                  <span>{ka.nav.profile}</span>
                </NavLink>
                <button type="button" className="nav__button" onClick={handleLogout}>
                  <LogOut size={18} className="nav__button-icon" />
                  <span>{ka.nav.logout}</span>
                </button>
              </>
            ) : (
              <>
                <NavLink to={ROUTES.login} className="nav__link" onClick={closeMobileMenu}>
                  <LogIn size={18} className="nav__link-icon" />
                  <span>{ka.nav.login}</span>
                </NavLink>
                <NavLink to={ROUTES.register} className="nav__link" onClick={closeMobileMenu}>
                  <UserPlus size={18} className="nav__link-icon" />
                  <span>{ka.nav.register}</span>
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

