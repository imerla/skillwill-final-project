import { useParams, Link, useNavigate } from 'react-router-dom'
import { useOrders, useOrder } from '../hooks'
import type { Order, OrderStatus } from '../types'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { formatPrice } from '../../../shared/lib/format'
import { formatDate } from '../../../shared/lib/format'
import { ka } from '../../../shared/i18n/ka'
import { ROUTES } from '../../../app/routes'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import './OrdersPage.css'

const statusMap: Record<OrderStatus, { label: string; variant: 'neutral' | 'success' | 'accent' | 'danger' }> = {
  pending: { label: ka.orders.statusPending, variant: 'neutral' },
  paid: { label: ka.orders.statusPaid, variant: 'success' },
  confirmed: { label: ka.orders.statusConfirmed, variant: 'success' },
  shipped: { label: ka.orders.statusShipped, variant: 'accent' },
  delivered: { label: ka.orders.statusDelivered, variant: 'success' },
  cancelled: { label: ka.orders.statusCancelled, variant: 'danger' },
  failed: { label: ka.orders.statusFailed, variant: 'danger' },
}

function getStatusBadge(status: OrderStatus) {
  const config = statusMap[status] || { label: status, variant: 'neutral' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function OrdersPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: orders, isLoading, error, refetch } = useOrders({ enabled: !id })
  const { data: orderDetail, isLoading: isLoadingDetail, error: errorDetail } = useOrder(id || '')

  useDocumentTitle(id ? ka.orders.orderDetails : ka.orders.title)

  if (id) {
    return <OrderDetail order={orderDetail?.order} isLoading={isLoadingDetail} error={errorDetail} onBack={() => navigate(ROUTES.orders)} />
  }

  if (isLoading) {
    return (
      <PageContainer size="page" as="section">
        <div className="orders-page__loading">
          <Skeleton style={{ height: '100px' }} />
          <Skeleton style={{ height: '100px' }} />
          <Skeleton style={{ height: '100px' }} />
        </div>
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

  if (!orders || orders.items.length === 0) {
    return (
      <PageContainer size="page" as="section">
        <h1 className="orders-page__title">{ka.orders.title}</h1>
        <EmptyState
          title={ka.orders.empty}
          actionLabel={ka.orders.startShopping}
          onAction={() => navigate(ROUTES.catalog)}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="page" as="section">
      <h1 className="orders-page__title">{ka.orders.title}</h1>
      <div className="orders-page__list">
        {orders.items.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </PageContainer>
  )
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Link to={ROUTES.order(order.id)} className="orders-page__card">
      <div className="orders-page__card-header">
        <div className="orders-page__order-id">{ka.orders.orderId}: {order.id.slice(0, 8)}...</div>
        {getStatusBadge(order.status)}
      </div>
      <div className="orders-page__card-date">{formatDate(order.createdAt)}</div>
      <div className="orders-page__card-total">
        {formatPrice(order.total, order.currency)}
      </div>
    </Link>
  )
}

function OrderDetail({ order, isLoading, error, onBack }: { order?: Order; isLoading: boolean; error: unknown; onBack: () => void }) {
  if (isLoading) {
    return (
      <PageContainer size="page" as="section">
        <div className="orders-page__loading">
          <Skeleton style={{ height: '200px' }} />
          <Skeleton style={{ height: '200px' }} />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer size="page" as="section">
        <ErrorState actionLabel={ka.checkout.backToOrders} onAction={onBack} />
      </PageContainer>
    )
  }

  if (!order) {
    return (
      <PageContainer size="page" as="section">
        <ErrorState title={ka.common.genericError} actionLabel={ka.checkout.backToOrders} onAction={onBack} />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="page" as="section">
      <Button variant="secondary" onClick={onBack} className="orders-page__back-btn">
        ← {ka.checkout.backToOrders}
      </Button>

      <div className="orders-page__detail">
        <h1 className="orders-page__detail-title">{ka.orders.orderDetails}</h1>

        <div className="orders-page__detail-header">
          <div className="orders-page__detail-info">
            <div className="orders-page__detail-label">{ka.orders.orderId}</div>
            <div className="orders-page__detail-value">{order.id}</div>
          </div>
          <div className="orders-page__detail-info">
            <div className="orders-page__detail-label">{ka.orders.date}</div>
            <div className="orders-page__detail-value">{formatDate(order.createdAt, true)}</div>
          </div>
          <div className="orders-page__detail-info">
            <div className="orders-page__detail-label">{ka.orders.status}</div>
            <div className="orders-page__detail-value">{getStatusBadge(order.status)}</div>
          </div>
          <div className="orders-page__detail-info">
            <div className="orders-page__detail-label">{ka.orders.total}</div>
            <div className="orders-page__detail-value orders-page__detail-value--total">
              {formatPrice(order.total, order.currency)}
            </div>
          </div>
        </div>

        <div className="orders-page__detail-section">
          <h2 className="orders-page__section-title">{ka.orders.shippingAddress}</h2>
          <div className="orders-page__shipping">
            <p className="orders-page__shipping-name">{order.shipping.fullName}</p>
            <p className="orders-page__shipping-phone">{order.shipping.phone}</p>
            <p className="orders-page__shipping-address">
              {order.shipping.city}, {order.shipping.address}
            </p>
          </div>
        </div>

        <div className="orders-page__detail-section">
          <h2 className="orders-page__section-title">{ka.orders.orderItems}</h2>
          <div className="orders-page__items">
            {order.items.map((item, index) => (
              <div key={index} className="orders-page__item">
                <div className="orders-page__item-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="orders-page__item-image"
                    loading="lazy"
                  />
                </div>
                <div className="orders-page__item-details">
                  <h3 className="orders-page__item-title">
                    <Link to={ROUTES.product(item.slug)}>{item.title}</Link>
                  </h3>
                  <p className="orders-page__item-qty">{ka.common.quantity}: {item.qty}</p>
                </div>
                <p className="orders-page__item-price">
                  {formatPrice(item.price * item.qty, order.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="orders-page__detail-footer">
          <div className="orders-page__total-row">
            <span>{ka.orders.total}</span>
            <span className="orders-page__total-value">
              {formatPrice(order.total, order.currency)}
            </span>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

