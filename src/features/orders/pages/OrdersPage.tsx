import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useOrders, useOrder } from '../hooks'
import type { Order, OrderStatus } from '../types'
import { ApiErrorClass } from '../../../shared/api'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { Alert } from '../../../shared/ui/Alert/Alert'
import { Pagination } from '../../../shared/ui/Pagination/Pagination'
import { formatPrice, formatDate } from '../../../shared/lib/format'
import { ka } from '../../../shared/i18n/ka'
import { ROUTES } from '../../../app/routes'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import './OrdersPage.css'

const statusMap: Record<
  OrderStatus,
  { label: string; variant: 'neutral' | 'success' | 'accent' | 'danger' }
> = {
  pending: { label: ka.orders.statusPending, variant: 'neutral' },
  paid: { label: ka.orders.statusPaid, variant: 'success' },
  confirmed: { label: ka.orders.statusConfirmed, variant: 'success' },
  shipped: { label: ka.orders.statusShipped, variant: 'accent' },
  delivered: { label: ka.orders.statusDelivered, variant: 'success' },
  cancelled: { label: ka.orders.statusCancelled, variant: 'danger' },
  failed: { label: ka.orders.statusFailed, variant: 'danger' },
}

function getStatusBadge(status: OrderStatus) {
  const config = statusMap[status] || {
    label: status,
    variant: 'neutral' as const,
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

function getItemsCount(order: Order) {
  return order.items.reduce((sum, item) => sum + item.qty, 0)
}

function OrdersLoading() {
  return (
    <div className="orders-page__loading" aria-label="იტვირთება">
      {[1, 2, 3].map((item) => (
        <Skeleton
          key={item}
          style={{
            height: '164px',
            borderRadius: 'var(--radius-lg)',
          }}
        />
      ))}
    </div>
  )
}

export function OrdersPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    data: orders,
    isLoading,
    error,
    refetch,
  } = useOrders({ enabled: !id })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const {
    data: orderDetail,
    isLoading: isLoadingDetail,
    error: errorDetail,
  } = useOrder(id || '')

  useDocumentTitle(id ? ka.orders.orderDetails : ka.orders.title)

  useEffect(() => {
    if (!id) refetch()
  }, [id, refetch])

  if (id) {
    return (
      <OrderDetail
        order={orderDetail?.order}
        isLoading={isLoadingDetail}
        error={errorDetail}
        onBack={() => navigate(ROUTES.orders)}
      />
    )
  }

  if (isLoading) {
    return (
      <PageContainer size="page" as="section">
        <div className="orders-container">
          <h1 className="orders-page__title">{ka.orders.title}</h1>
          <OrdersLoading />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    const errorMessage =
      error instanceof ApiErrorClass ? error.message : 'შეცდომა მოხდა'

    return (
      <PageContainer size="page" as="section">
        <div className="orders-container">
          <h1 className="orders-page__title">{ka.orders.title}</h1>
          <Alert
            variant="error"
            message={errorMessage}
            className="orders-page__alert"
          />
          <ErrorState onAction={() => refetch()} />
        </div>
      </PageContainer>
    )
  }

  if (!orders || orders.items.length === 0) {
    return (
      <PageContainer size="page" as="section">
        <div className="orders-container">
          <h1 className="orders-page__title">{ka.orders.title}</h1>
          <div className="orders-page__empty-wrap">
            <EmptyState
              title={ka.orders.empty}
              actionLabel={ka.orders.startShopping}
              onAction={() => navigate(ROUTES.catalog)}
            />
          </div>
        </div>
      </PageContainer>
    )
  }

  const totalItems = orders.items.reduce(
    (sum, order) => sum + getItemsCount(order),
    0,
  )

  const totalPages = Math.ceil(orders.items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = orders.items.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageContainer size="page" as="section">
      <div className="orders-container">
        <h1 className="orders-page__title">{ka.orders.title}</h1>

        <section className="orders-page__overview" aria-label="შეკვეთების შეჯამება">
          <div className="orders-page__overview-copy">
            <span className="orders-page__overview-label">
              ჯამურად შეკვეთების რაოდენობა
            </span>
            <strong className="orders-page__overview-value">
              {orders.items.length}
            </strong>
          </div>

          <div className="orders-page__overview-divider" />

          <div className="orders-page__overview-copy">
            <span className="orders-page__overview-label">
              ჯამურად შეძენილი ნივთების რაოდენობა
            </span>
            <strong className="orders-page__overview-value">
              {totalItems}
            </strong>
          </div>

          <div className="orders-page__overview-decoration" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        <div className="orders-page__list">
          {paginatedOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="orders-page__pagination">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </PageContainer>
  )
}

function OrderCard({ order }: { order: Order }) {
  const totalItemsCount = getItemsCount(order)
  const visibleItems = order.items.slice(0, 4)
  const remainingItems = Math.max(0, order.items.length - visibleItems.length)
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <Link
      to={ROUTES.order(order.id)}
      className="orders-page__card"
      aria-label={`${ka.orders.orderId} ${order.id.slice(0, 8)}, ${formatPrice(subtotal, order.currency)} — დეტალების ნახვა`}
    >
      <div className="orders-page__card-top">
        <div className="orders-page__card-identity">
          <span className="orders-page__card-label">
            {ka.orders.orderId}
          </span>
          <span className="orders-page__order-id">
            #{order.id.slice(0, 8)}
          </span>
        </div>

        {getStatusBadge(order.status)}
      </div>

      <div className="orders-page__card-content">
        <div className="orders-page__card-main">
          <div className="orders-page__card-meta">
            <span className="orders-page__meta-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" />
              </svg>
            </span>
            <time dateTime={order.createdAt} className="orders-page__card-date">
              {formatDate(order.createdAt, true)}
            </time>
          </div>

          <div
            className="orders-page__card-thumbnails"
            aria-label={`${totalItemsCount} ნივთი`}
          >
            {visibleItems.map((item, index) => (
              <div
                key={`${item.slug}-${index}`}
                className="orders-page__thumbnail-wrapper"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="orders-page__card-item-image"
                  loading="lazy"
                />
                {item.qty > 1 && (
                  <span className="orders-page__card-item-qty">
                    ×{item.qty}
                  </span>
                )}
              </div>
            ))}

            {remainingItems > 0 && (
              <span className="orders-page__thumbnail-more">
                +{remainingItems}
              </span>
            )}

            {order.items.length === 0 && (
              <span className="orders-page__no-items">
                პროდუქტები არ არის
              </span>
            )}
          </div>

          <span className="orders-page__item-count">
            {totalItemsCount} პროდუქტი
          </span>
        </div>

        <div className="orders-page__card-side">
          <div className="orders-page__total-block">
            <strong className="orders-page__card-total">
              {formatPrice(subtotal, order.currency)}
            </strong>
          </div>

          <span className="orders-page__card-open">
            დეტალები
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}

function OrderDetail({
  order,
  isLoading,
  error,
  onBack,
}: {
  order?: Order
  isLoading: boolean
  error: unknown
  onBack: () => void
}) {
  if (isLoading) {
    return (
      <PageContainer size="page" as="section">
        <div className="orders-container">
          <Button
            variant="secondary"
            onClick={onBack}
            className="orders-page__back-btn"
          >
            {ka.checkout.backToOrders}
          </Button>
          <div className="orders-page__detail-loading">
            <Skeleton
              style={{ height: '360px', borderRadius: 'var(--radius-lg)' }}
            />
            <Skeleton
              style={{ height: '260px', borderRadius: 'var(--radius-lg)' }}
            />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (error || !order) {
    return (
      <PageContainer size="page" as="section">
        <div className="orders-container">
          <Button
            variant="secondary"
            onClick={onBack}
            className="orders-page__back-btn"
          >
            {ka.checkout.backToOrders}
          </Button>
          <ErrorState
            title={ka.common.genericError}
            actionLabel={ka.checkout.backToOrders}
            onAction={onBack}
          />
        </div>
      </PageContainer>
    )
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  )
  const totalItemsCount = getItemsCount(order)
  const shippingFee = 0
  const displayTotal = subtotal + shippingFee

  return (
    <PageContainer size="page" as="section">
      <div className="orders-container orders-container--detail">
        <Button
          variant="secondary"
          onClick={onBack}
          className="orders-page__back-btn"
        >
          {ka.checkout.backToOrders}
        </Button>

        <header className="orders-page__detail-hero">
          <div className="orders-page__detail-hero-top">
            <div className="orders-page__detail-heading">
              <h1 className="orders-page__detail-title">
                {ka.orders.orderDetails}
              </h1>
              <p className="orders-page__detail-number">
                შეკვეთის ID: <strong>#{order.id.slice(0, 8)}</strong>
              </p>
            </div>
            <div className="orders-page__detail-status">
              {getStatusBadge(order.status)}
            </div>
          </div>

          <div className="orders-page__detail-facts">
            <div className="orders-page__detail-fact">
              <span className="orders-page__fact-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                  <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17" />
                </svg>
              </span>
              <span>
                <span className="orders-page__fact-label">შეკვეთის თარიღი</span>
                <strong>{formatDate(order.createdAt, true)}</strong>
              </span>
            </div>

            <div className="orders-page__detail-fact">
              <span className="orders-page__fact-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 7.5h11v10H3zM14 11h4l3 3v3.5h-7z" />
                  <circle cx="7" cy="19" r="2" />
                  <circle cx="17.5" cy="19" r="2" />
                </svg>
              </span>
              <span>
                <span className="orders-page__fact-label">ნივთების რაოდენობა</span>
                <strong>{totalItemsCount}</strong>
              </span>
            </div>
          </div>
        </header>

        <div className="orders-page__detail-layout">
          <section
            className="orders-page__main-panel"
            aria-labelledby="order-items-heading"
          >
            <h2
              id="order-items-heading"
              className="orders-page__section-title"
            >
              {ka.orders.orderItems}
            </h2>

            {order.items.length > 0 ? (
              <div className="orders-page__items">
                {order.items.map((item, index) => (
                  <article
                    key={`${item.slug}-${index}`}
                    className="orders-page__item"
                  >
                    <Link
                      to={ROUTES.product(item.slug)}
                      className="orders-page__item-image-wrapper"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <img
                        src={item.image}
                        alt=""
                        className="orders-page__item-image"
                        loading="lazy"
                      />
                    </Link>

                    <div className="orders-page__item-details">
                      <h3 className="orders-page__item-title">
                        <Link to={ROUTES.product(item.slug)}>
                          {item.title}
                        </Link>
                      </h3>
                      <p className="orders-page__item-unit-price">
                        {formatPrice(item.price, order.currency)} / ერთეული
                      </p>
                      <span className="orders-page__item-quantity">
                        რაოდენობა: {item.qty}
                      </span>
                    </div>

                    <div className="orders-page__item-price-block">
                      <strong className="orders-page__item-price">
                        {formatPrice(item.price * item.qty, order.currency)}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="orders-page__no-items">
                შეკვეთაში პროდუქტები არ მოიძებნა.
              </p>
            )}
          </section>

          <aside className="orders-page__side-panel">
            <section
              className="orders-page__summary-card"
              aria-labelledby="order-summary-heading"
            >
              <h2
                id="order-summary-heading"
                className="orders-page__section-title"
              >
                შეკვეთის შეჯამება
              </h2>

              <div className="summary-row">
                <span>ნივთების ღირებულება</span>
                <span>{formatPrice(subtotal, order.currency)}</span>
              </div>

              <div className="summary-row">
                <span>მიწოდების საფასური</span>
                <span>{formatPrice(shippingFee, order.currency)}</span>
              </div>

              <div className="summary-row summary-row--total">
                <span>{ka.orders.total}</span>
                <strong className="orders-page__total-value">
                  {formatPrice(displayTotal, order.currency)}
                </strong>
              </div>
            </section>

            <section
              className="orders-page__shipping-card"
              aria-labelledby="order-shipping-heading"
            >
              <div className="orders-page__shipping-heading">
                <span className="orders-page__shipping-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M3 7.5h11v10H3zM14 11h4l3 3v3.5h-7z" />
                    <circle cx="7" cy="19" r="2" />
                    <circle cx="17.5" cy="19" r="2" />
                  </svg>
                </span>
                <h2
                  id="order-shipping-heading"
                  className="orders-page__section-title"
                >
                  მიწოდების მისამართი
                </h2>
              </div>

              <div className="orders-page__shipping-content">
                <p className="orders-page__shipping-name">
                  {order.shipping.fullName}
                </p>
                <p className="orders-page__shipping-phone">
                  {order.shipping.phone}
                </p>
                <p className="orders-page__shipping-address">
                  {order.shipping.city}, {order.shipping.address}
                </p>
              </div>
            </section>

            <section
              className="orders-page__shipping-card"
              aria-labelledby="order-delivery-heading"
            >
              <div className="orders-page__shipping-heading">
                <span className="orders-page__shipping-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </span>
                <h2
                  id="order-delivery-heading"
                  className="orders-page__section-title"
                >
                  მიწოდების მეთოდი
                </h2>
              </div>

              <div className="orders-page__shipping-content">
                <p className="orders-page__shipping-name">
                  სწრაფი მიწოდება
                </p>
                <p className="orders-page__shipping-phone">
                  1-3 სამუშაო დღე
                </p>
                <p className="orders-page__shipping-address">
                  უფასო
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </PageContainer>
  )
}
