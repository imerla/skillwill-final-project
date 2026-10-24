import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, useUpdateCartItemQuantity, useRemoveCartItem, useClearCart } from '../hooks'
import { getCartErrorMessage, getAvailableStock } from '../errors'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { QuantityStepper } from '../../../shared/ui/QuantityStepper/QuantityStepper'
import { Alert } from '../../../shared/ui/Alert/Alert'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { Price } from '../../../shared/ui/Price/Price'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog/ConfirmDialog'
import { ProductCard } from '../../../features/catalog/components/ProductCard'
import { Carousel } from '../../../shared/ui/Carousel/Carousel'
import { useProducts } from '../../../features/catalog/hooks'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { formatPrice } from '../../../shared/lib/format'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import type { CartItem } from '../types'
import './CartPage.css'

export function CartPage() {
  const { t } = useLanguage()
  const { data: cart, isLoading, error, refetch } = useCart()
  const updateQuantity = useUpdateCartItemQuantity()
  const removeItem = useRemoveCartItem()
  const clearCart = useClearCart()
  const navigate = useNavigate()
  const [actionErrorKey, setActionErrorKey] = useState<'genericError' | 'networkError' | null>(null)
  const [quantityErrors, setQuantityErrors] = useState<Record<string, { type: 'stockChanged' | 'genericError' | 'networkError' | 'outOfStock' | 'productGone' | 'itemGone' | 'qtyRange'; stock?: number }>>({})
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const firstProductBrand = cart?.items[0]?.product.brand
  const { data: similarProducts, isLoading: similarLoading } = useProducts(
    firstProductBrand ? { brand: firstProductBrand, limit: 8 } : {},
    { enabled: !!firstProductBrand && cart.items.length > 0 }
  )

  useDocumentTitle(t.cart.title)

  const isAnyMutationPending = updateQuantity.isPending || removeItem.isPending || clearCart.isPending

  const handleQuantityChange = (itemId: string, qty: number) => {
    setActionErrorKey(null)
    setQuantityErrors((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    // Find the item to check stock
    const item = cart?.items.find((i) => i.id === itemId)
    const maxStock = item?.product.stock ?? 99
    // Don't auto-cap - reject if quantity exceeds stock
    if (qty > maxStock) {
      setQuantityErrors((prev) => ({
        ...prev,
        [itemId]: { type: 'stockChanged', stock: maxStock }
      }))
      return
    }
    updateQuantity.mutate(
      { id: itemId, data: { qty } },
      {
        onSuccess: () => {
          setActionErrorKey(null)
          setQuantityErrors((prev) => {
            const next = { ...prev }
            delete next[itemId]
            return next
          })
        },
        onError: (e) => {
          const errorMsg = getCartErrorMessage(e, t)
          let errorType: 'genericError' | 'networkError' | 'outOfStock' | 'productGone' | 'itemGone' | 'qtyRange' = 'genericError'
          if (errorMsg === t.common.networkError) errorType = 'networkError'
          else if (errorMsg === t.cart.outOfStock) errorType = 'outOfStock'
          else if (errorMsg === t.cart.productGone) errorType = 'productGone'
          else if (errorMsg === t.cart.itemGone) errorType = 'itemGone'
          else if (errorMsg === t.cart.qtyRange) errorType = 'qtyRange'
          setActionErrorKey(errorType === 'networkError' ? 'networkError' : 'genericError')
          setQuantityErrors((prev) => ({
            ...prev,
            [itemId]: { type: errorType, stock: getAvailableStock(e) }
          }))
        },
      }
    )
  }

  const handleRemove = (item: CartItem) => {
    setActionErrorKey(null)
    removeItem.mutate(item.id, {
      onSuccess: () => setActionErrorKey(null),
      onError: () => setActionErrorKey('genericError'),
    })
  }

  const handleClearCart = () => {
    setShowClearConfirm(true)
  }

  const handleClearCartConfirm = () => {
    setShowClearConfirm(false)
    setActionErrorKey(null)
    clearCart.mutate(undefined, {
      onSuccess: () => setActionErrorKey(null),
      onError: () => setActionErrorKey('genericError'),
    })
  }

  const handleClearCartCancel = () => {
    setShowClearConfirm(false)
  }

  const hasStockIssue = cart?.items.some(
    (item) => !item.product.inStock || item.product.stock < item.qty
  ) ?? false

  const hasQuantityError = Object.keys(quantityErrors).some((key) => quantityErrors[key].type !== 'stockChanged' || quantityErrors[key].stock !== undefined)

  const getQuantityErrorMessage = (error: { type: string; stock?: number }): string => {
    switch (error.type) {
      case 'stockChanged':
        return error.stock !== undefined
          ? `${t.cart.stockChanged} ${t.cart.onlyN(error.stock)}`
          : t.cart.stockChanged
      case 'outOfStock':
        return t.cart.outOfStock
      case 'productGone':
        return t.cart.productGone
      case 'itemGone':
        return t.cart.itemGone
      case 'qtyRange':
        return t.cart.qtyRange
      case 'networkError':
        return t.common.networkError
      case 'genericError':
        return t.common.genericError
      default:
        return t.common.genericError
    }
  }



  if (isLoading) {
    return (
      <PageContainer size="page" as="section">
        <h1 className="cart-page__page-title">{t.cart.title}</h1>
        <ul className="cart-page__list">
          {[1, 2, 3].map((i) => (
            <li key={i} className="cart-page__item-skeleton">
              <Skeleton variant="rect" className="cart-page__thumb-skeleton" />
              <div className="cart-page__details-skeleton">
                <Skeleton variant="text" className="cart-page__skeleton-title" />
                <Skeleton variant="text" className="cart-page__skeleton-price" />
              </div>
              <Skeleton variant="rect" className="cart-page__stepper-skeleton" />
              <Skeleton variant="text" className="cart-page__total-skeleton" />
            </li>
          ))}
        </ul>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer size="page" as="section">
        <ErrorState onAction={() => refetch()} />
      </PageContainer>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <PageContainer size="page" as="section">
        <EmptyState
          title={t.cart.empty}
          actionLabel={t.cart.backToCatalog}
          onAction={() => navigate(ROUTES.catalog)}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="page" as="section">
      <h1 className="cart-page__page-title">{t.cart.title}</h1>

      {actionErrorKey && <Alert variant="error" message={actionErrorKey === 'networkError' ? t.common.networkError : t.common.genericError} className="cart-page__alert" />}

      <div className="cart-page__content">
        <ul className="cart-page__list">
          {cart.items.map((item) => {
            const maxQty = Math.min(item.product.stock, 99)
            const hasStockIssue = !item.product.inStock || item.product.stock < item.qty

            // Calculate discount percent if not provided by backend
            const calculatedDiscountPercent = item.product.discountPercent
              ? item.product.discountPercent
              : item.product.oldPrice && item.product.oldPrice > item.product.price
                ? Math.round(((item.product.oldPrice - item.product.price) / item.product.oldPrice) * 100)
                : undefined

            return (
              <li key={item.id} className="cart-page__item">
                <div className="cart-page__thumb">
                  <img
                    src={item.product.image}
                    alt={item.product.title}
                    loading="lazy"
                    className="cart-page__img"
                  />
                </div>
                <div className="cart-page__info">
                  <Link to={ROUTES.product(item.product.slug)} className="cart-page__title-link">
                    {item.product.title}
                  </Link>
                  <div className="cart-page__price">
                    <Price
                      value={item.product.price}
                      oldValue={item.product.oldPrice ?? undefined}
                      discountPercent={calculatedDiscountPercent}
                      currency={cart.currency}
                      t={t}
                    />
                  </div>
                  {hasStockIssue && (
                    <div className="cart-page__stock-alert">
                      {!item.product.inStock ? (
                        <Badge variant="danger">{t.cart.outOfStock}</Badge>
                      ) : (
                        <Alert variant="warning" message={t.cart.onlyN(item.product.stock)} />
                      )}
                    </div>
                  )}
                </div>
                <div className="cart-page__item-actions">
                  <div className="cart-page__controls">
                    <QuantityStepper
                      value={item.qty}
                      onChange={(qty) => handleQuantityChange(item.id, qty)}
                      min={1}
                      max={maxQty}
                      disabled={isAnyMutationPending || !item.product.inStock}
                      t={t}
                    />
                    {quantityErrors[item.id] && (
                      <Alert variant="error" message={getQuantityErrorMessage(quantityErrors[item.id])} className="cart-page__quantity-error" />
                    )}
                  </div>
                  <div className="cart-page__actions-wrapper">
                    <div className="cart-page__total" aria-label={t.cart.lineTotal}>
                      {formatPrice(item.lineTotal, cart.currency)}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleRemove(item)}
                      disabled={isAnyMutationPending}
                      aria-label={t.cart.removeAria(item.product.title)}
                      className="cart-page__remove"
                    >
                      {t.cart.remove}
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="cart-page__summary">
          <h2 className="cart-page__summary-title">{t.cart.summary}</h2>
          <div className="cart-page__summary-row">
            <span className="cart-page__summary-label">
              {t.cart.itemsCount(cart?.totalQty ?? 0)}
            </span>
            <span className="cart-page__summary-value">
              {formatPrice(cart?.subtotal ?? 0, cart?.currency ?? 'GEL')}
            </span>
          </div>
          <div className="cart-page__summary-row cart-page__summary-row--total">
            <span className="cart-page__summary-label">{t.cart.subtotal}</span>
            <span className="cart-page__summary-value cart-page__summary-value--total">
              {formatPrice(cart?.subtotal ?? 0, cart?.currency ?? 'GEL')}
            </span>
          </div>
          <div className="cart-page__actions">
            <Button
              onClick={() => navigate(ROUTES.checkout)}
              disabled={
                hasStockIssue ||
                hasQuantityError ||
                isAnyMutationPending ||
                (cart?.items.length ?? 0) === 0
              }
              aria-describedby={(hasStockIssue || hasQuantityError) ? 'cart-checkout-blocked' : undefined}
              className="cart-page__checkout"
            >
              {t.cart.checkout}
            </Button>
            {(hasStockIssue || hasQuantityError) && (
              <p id="cart-checkout-blocked" className="cart-page__blocked-text">
                {hasQuantityError ? t.cart.stockChanged : t.cart.checkoutBlocked}
              </p>
            )}
            <Button
              variant="secondary"
              onClick={handleClearCart}
              disabled={isAnyMutationPending}
              className="cart-page__clear"
            >
              {t.cart.clear}
            </Button>
          </div>
        </div>
      </div>

      {/* Similar Products Section */}
      {similarProducts && similarProducts.items.length > 0 && (
        <div className="cart-page__similar-section">
          <PageContainer size="page" as="section">
            <div className="cart-page__similar-header">
            <h2 className="cart-page__similar-title">{t.cart.similarProducts}</h2>
            <Link to={ROUTES.catalog} className="cart-page__similar-link">
              {t.cart.viewAll}
            </Link>
          </div>
          <Carousel itemsPerView={4} gap={24}>
            {similarLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="cart-page__similar-skeleton">
                    <Skeleton variant="rect" className="cart-page__similar-skeleton-image" />
                    <Skeleton variant="rect" className="cart-page__similar-skeleton-title" />
                    <Skeleton variant="rect" className="cart-page__similar-skeleton-price" />
                  </div>
                ))
              : similarProducts.items.map((product) => (
                  <ProductCard key={product.id} product={product} t={t} />
                ))}
          </Carousel>
        </PageContainer>
        </div>
      )}

      <ConfirmDialog
        isOpen={showClearConfirm}
        title={t.cart.clear}
        message={t.cart.clearConfirm}
        confirmLabel={t.cart.clear}
        cancelLabel={t.common.show}
        onConfirm={handleClearCartConfirm}
        onCancel={handleClearCartCancel}
        variant="danger"
      />
    </PageContainer>
  )
}

