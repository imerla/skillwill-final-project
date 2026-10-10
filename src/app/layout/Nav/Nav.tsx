import { NavLink, useNavigate } from 'react-router-dom'
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

  const handleLogout = () => {
    logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <header className="nav">
      <nav aria-label={ka.nav.primaryNav}>
        <div className="nav__container">
          <NavLink to={ROUTES.catalog} className="nav__brand">
            {ka.nav.brand}
          </NavLink>
          <div className="nav__links">
            <NavLink to={ROUTES.catalog} className="nav__link">
              {ka.nav.products}
            </NavLink>
            <NavLink
              to={ROUTES.cart}
              className="nav__link"
              aria-label={isAuthenticated && totalQty > 0 ? ka.nav.cartCount(totalQty) : undefined}
            >
              {ka.nav.cart}
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
                <NavLink to={ROUTES.orders} className="nav__link">
                  {ka.nav.orders}
                </NavLink>
                <NavLink to={ROUTES.profile} className="nav__link">
                  {ka.nav.profile}
                </NavLink>
                <button type="button" className="nav__button" onClick={handleLogout}>
                  {ka.nav.logout}
                </button>
              </>
            ) : (
              <>
                <NavLink to={ROUTES.login} className="nav__link">
                  {ka.nav.login}
                </NavLink>
                <NavLink to={ROUTES.register} className="nav__link">
                  {ka.nav.register}
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

