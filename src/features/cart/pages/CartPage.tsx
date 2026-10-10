import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, useUpdateCartItemQuantity, useRemoveCartItem, useClearCart } from '../hooks'
import { getCartErrorMessage } from '../errors'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { QuantityStepper } from '../../../shared/ui/QuantityStepper/QuantityStepper'
import { Alert } from '../../../shared/ui/Alert/Alert'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { Price } from '../../../shared/ui/Price/Price'
import { ka } from '../../../shared/i18n/ka'
import { formatPrice } from '../../../shared/lib/format'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import type { CartItem } from '../types'
import './CartPage.css'

export function CartPage() {
  const { data: cart, isLoading, error, refetch } = useCart()
  const updateQuantity = useUpdateCartItemQuantity()
  const removeItem = useRemoveCartItem()
  const clearCart = useClearCart()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState<string | null>(null)

  useDocumentTitle(ka.cart.title)

  const isAnyMutationPending = updateQuantity.isPending || removeItem.isPending || clearCart.isPending

  const hasStockIssue = cart?.items.some((item) => !item.product.inStock || item.product.stock < item.qty) ?? false

  const handleQuantityChange = (itemId: string, qty: number) => {
    setActionError(null)
    updateQuantity.mutate(
      { id: itemId, data: { qty } },
      {
        onSuccess: () => setActionError(null),
        onError: (e) => setActionError(getCartErrorMessage(e)),
      }
    )
  }

  const handleRemove = (item: CartItem) => {
    setActionError(null)
    removeItem.mutate(item.id, {
      onSuccess: () => setActionError(null),
      onError: (e) => setActionError(getCartErrorMessage(e, { stock: item.product.stock })),
    })
  }

  const handleClearCart = () => {
    if (window.confirm(ka.cart.clearConfirm)) {
      setActionError(null)
      clearCart.mutate(undefined, {
        onSuccess: () => setActionError(null),
        onError: (e) => setActionError(getCartErrorMessage(e)),
      })
    }
  }

  if (isLoading) {
    return (
      <PageContainer size="page" as="section">
        <h1 className="cart-page__title">{ka.cart.title}</h1>
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
          title={ka.cart.empty}
          actionLabel={ka.cart.backToCatalog}
          onAction={() => navigate(ROUTES.catalog)}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="page" as="section">
      <h1 className="cart-page__title">{ka.cart.title}</h1>

      {actionError && <Alert variant="error" message={actionError} className="cart-page__alert" />}

      <div className="cart-page__content">
        <ul className="cart-page__list">
          {cart.items.map((item) => {
            const maxQty = Math.min(item.product.stock, 99)
            const hasStockIssue = !item.product.inStock || item.product.stock < item.qty

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
                      currency={cart.currency}
                    />
                  </div>
                  {hasStockIssue && (
                    <div className="cart-page__stock-alert">
                      {!item.product.inStock ? (
                        <Badge variant="danger">{ka.cart.outOfStock}</Badge>
                      ) : (
                        <Alert variant="warning" message={ka.cart.onlyN(item.product.stock)} />
                      )}
                    </div>
                  )}
                </div>
                <div className="cart-page__controls">
                  <QuantityStepper
                    value={item.qty}
                    onChange={(qty) => handleQuantityChange(item.id, qty)}
                    min={1}
                    max={maxQty}
                    disabled={isAnyMutationPending || !item.product.inStock}
                  />
                </div>
                <div className="cart-page__total" aria-label={ka.cart.lineTotal}>
                  {formatPrice(item.lineTotal, cart.currency)}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleRemove(item)}
                  disabled={isAnyMutationPending}
                  aria-label={ka.cart.removeAria(item.product.title)}
                  className="cart-page__remove"
                >
                  {ka.cart.remove}
                </Button>
              </li>
            )
          })}
        </ul>

        <div className="cart-page__summary">
          <h2 className="cart-page__summary-title">{ka.cart.summary}</h2>
          <div className="cart-page__summary-row">
            <span className="cart-page__summary-label">{ka.cart.itemsCount(cart.totalQty)}</span>
            <span className="cart-page__summary-value">{formatPrice(cart.subtotal, cart.currency)}</span>
          </div>
          <div className="cart-page__summary-row cart-page__summary-row--total">
            <span className="cart-page__summary-label">{ka.cart.subtotal}</span>
            <span className="cart-page__summary-value cart-page__summary-value--total">
              {formatPrice(cart.subtotal, cart.currency)}
            </span>
          </div>
          <div className="cart-page__actions">
            <Button
              onClick={() => navigate(ROUTES.checkout)}
              disabled={hasStockIssue || isAnyMutationPending || cart.items.length === 0}
              aria-describedby={hasStockIssue ? 'cart-checkout-blocked' : undefined}
              className="cart-page__checkout"
            >
              {ka.cart.checkout}
            </Button>
            {hasStockIssue && (
              <p id="cart-checkout-blocked" className="cart-page__blocked-text">
                {ka.cart.checkoutBlocked}
              </p>
            )}
            <Button
              variant="secondary"
              onClick={handleClearCart}
              disabled={isAnyMutationPending}
              className="cart-page__clear"
            >
              {ka.cart.clear}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

