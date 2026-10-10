import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Home, ShoppingBag, ShoppingCart, Package, User, LogIn, UserPlus, LogOut, Info } from 'lucide-react'
import { useSession } from '../../../shared/auth'
import { useCart } from '../../../features/cart/hooks'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { ka } from '../../../shared/i18n/ka'
import { ROUTES } from '../../routes'
import './Nav.css'

export function Nav() {
  const { isAuthenticated, isLoading, logout } = useSession()
  const { data: cart } = useCart()
  const navigate = useNavigate()
  const totalQty = cart?.totalQty || 0
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    <header className="nav">
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
          
          <button
            type="button"
            className="nav__burger"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? ka.nav.closeMenu : ka.nav.menu}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
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

