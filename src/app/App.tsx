import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider, ProtectedRoute } from '../shared/auth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { CatalogPage } from '../features/catalog/pages/CatalogPage'
import { ProductDetailsPage } from '../features/catalog/pages/ProductDetailsPage'
import { CartPage } from '../features/cart/pages/CartPage'
import { CheckoutPage } from '../features/checkout/pages/CheckoutPage'
import { OrdersPage } from '../features/orders/pages/OrdersPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { Nav } from './layout/Nav/Nav'
import { LegacyCatalogRedirect } from './LegacyCatalogRedirect'
import { ROUTES } from './routes'

// DEV-only UI demo page
import { UiDemoPage } from './UiDemoPage'

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/products" element={<LegacyCatalogRedirect />} />
          <Route path={ROUTES.catalog} element={<CatalogPage />} />
          <Route path={ROUTES.product(':slug')} element={<ProductDetailsPage />} />
          <Route
            path={ROUTES.cart}
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.checkout}
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.orders}
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={`${ROUTES.orders}/:id`}
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.profile}
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to={ROUTES.catalog} replace />} />
          {import.meta.env.DEV && <Route path="/ui" element={<UiDemoPage />} />}
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}

export default App

