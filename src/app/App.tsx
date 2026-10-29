import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SessionProvider, ProtectedRoute } from '../shared/auth'
import { LanguageProvider } from '../shared/i18n/LanguageContext'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { HomePage } from '../features/home/pages/HomePage'
import { CatalogPage } from '../features/catalog/pages/CatalogPage'
import { Nav } from './layout/Nav/Nav'
import { Footer } from '../shared/ui/Footer/Footer'
import { LegacyCatalogRedirect } from './LegacyCatalogRedirect'
import { ROUTES } from './routes'
import { UiDemoPage } from './UiDemoPage'

const AboutUsPage = lazy(() => import('../features/about/pages/AboutUsPage').then(m => ({ default: m.AboutUsPage })))
const ProductDetailsPage = lazy(() => import('../features/catalog/pages/ProductDetailsPage').then(m => ({ default: m.ProductDetailsPage })))
const CartPage = lazy(() => import('../features/cart/pages/CartPage').then(m => ({ default: m.CartPage })))
const CheckoutPage = lazy(() => import('../features/checkout/pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })))
const OrdersPage = lazy(() => import('../features/orders/pages/OrdersPage').then(m => ({ default: m.OrdersPage })))
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const FavoritesPage = lazy(() => import('../features/favorites/pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })))

function App() {
  return (
    <LanguageProvider>
      <SessionProvider>
        <BrowserRouter>
          <Nav />
          <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
            <Routes>
            <Route path={ROUTES.home} element={<HomePage />} />
            <Route path={ROUTES.about} element={<AboutUsPage />} />
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
            <Route
              path={ROUTES.favorites}
              element={
                <ProtectedRoute>
                  <FavoritesPage />
                </ProtectedRoute>
              }
            />
            {import.meta.env.DEV && <Route path="/ui" element={<UiDemoPage />} />}
            </Routes>
          </Suspense>
          <Footer />
        </BrowserRouter>
      </SessionProvider>
    </LanguageProvider>
  )
}

export default App

