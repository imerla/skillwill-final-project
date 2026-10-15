import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { useFavorites, useRemoveFromFavorites } from '../hooks'
import { useAddToCart } from '../../cart/hooks'
import { useProducts } from '../../catalog/hooks'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { Alert } from '../../../shared/ui/Alert/Alert'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { Price } from '../../../shared/ui/Price/Price'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog/ConfirmDialog'
import { ka } from '../../../shared/i18n/ka'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import './FavoritesPage.css'

export function FavoritesPage() {
  const { data: favorites, isLoading, error, refetch } = useFavorites()
  const removeFromFavorites = useRemoveFromFavorites()
  const addToCart = useAddToCart()
  const [actionError, setActionError] = useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<string | null>(null)

  useDocumentTitle(ka.favorites.title)

  const isAnyMutationPending = removeFromFavorites.isPending || addToCart.isPending

  // Get stored favorite IDs from localStorage as fallback
  const getStoredFavoriteIds = (): string[] => {
    try {
      const stored = localStorage.getItem('favorites_ids')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Use API favorites if available, otherwise use localStorage
  const favoriteIds = favorites?.items.map((f) => f.productId) ?? getStoredFavoriteIds()

  // Fetch products (only if we have favorite IDs)
  const { data: products, isLoading: productsLoading } = useProducts(
    favoriteIds.length > 0 ? { limit: 100 } : {},
    { enabled: favoriteIds.length > 0 }
  )

  // Filter products to only show favorited ones
  const favoriteProducts = products?.items.filter((p) => favoriteIds.includes(p.id)) ?? []

  // Show loading if either favorites or products are loading
  const showLoading = isLoading || (favoriteIds.length > 0 && productsLoading)

  const handleRemove = (productId: string) => {
    setActionError(null)
    setItemToRemove(productId)
    setShowRemoveConfirm(true)
  }

  const handleAddToCart = (productId: string) => {
    setActionError(null)
    addToCart.mutate(
      { productId, qty: 1 },
      {
        onSuccess: () => {
          // არ ვშლით favorites-დან, სურვილისამებრ შეიძლება დარჩეს
        },
        onError: () => {
          setActionError('შეცდომა კალათაში დამატებისას')
        },
      }
    )
  }

  const handleRemoveConfirm = () => {
    if (!itemToRemove) return

    removeFromFavorites.mutate(itemToRemove, {
      onSuccess: () => {
        setShowRemoveConfirm(false)
        setItemToRemove(null)
      },
      onError: () => {
        setActionError('შეცდომა წაშლისას')
        setShowRemoveConfirm(false)
      },
    })
  }

  const handleRemoveCancel = () => {
    setShowRemoveConfirm(false)
    setItemToRemove(null)
  }

  if (showLoading) {
    return (
      <PageContainer size="page" as="section">
        <h1 className="favorites-page__page-title">{ka.favorites.title}</h1>
        <div className="favorites-page__grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="favorites-page__skeleton">
              <Skeleton className="favorites-page__skeleton-image" />
              <Skeleton className="favorites-page__skeleton-title" />
              <Skeleton className="favorites-page__skeleton-price" />
            </div>
          ))}
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer size="page" as="section">
        <ErrorState
          onAction={() => refetch()}
        />
      </PageContainer>
    )
  }

  if (!favorites || favoriteIds.length === 0) {
    return (
      <PageContainer size="page" as="section">
        <h1 className="favorites-page__page-title">{ka.favorites.title}</h1>
        <EmptyState
          title={ka.favorites.empty}
          actionLabel={ka.catalog.titleFallback}
          onAction={() => (window.location.href = ROUTES.catalog)}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="page" as="section">
      <h1 className="favorites-page__page-title">{ka.favorites.title}</h1>

      {actionError && <Alert variant="error" message={actionError} className="favorites-page__alert" />}

      <div className="favorites-page__grid">
        {favoriteProducts.map((product) => (
          <div key={product.id} className="favorites-page__item">
            <Link to={ROUTES.product(product.slug)} className="favorites-page__item-link">
              <img
                src={product.image}
                alt={product.title}
                className="favorites-page__item-image"
              />
              {product.discountPercent && product.discountPercent > 0 && (
                <div className="favorites-page__discount-badge">
                  -{product.discountPercent}%
                </div>
              )}
            </Link>
            <div className="favorites-page__item-content">
              <Link
                to={ROUTES.product(product.slug)}
                className="favorites-page__item-title"
              >
                {product.title}
              </Link>
              <div className="favorites-page__item-brand">{product.brand}</div>
              <div className="favorites-page__item-price">
                <Price
                  value={product.price}
                  oldValue={product.oldPrice ?? undefined}
                  discountPercent={product.discountPercent ?? undefined}
                  currency={product.currency}
                />
              </div>
              <div className="favorites-page__item-actions">
                <Button
                  variant="primary"
                  onClick={() => handleAddToCart(product.id)}
                  disabled={isAnyMutationPending}
                  className="favorites-page__add-to-cart"
                  aria-label="კალათაში დამატება"
                >
                  <ShoppingCart size={18} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleRemove(product.id)}
                  disabled={isAnyMutationPending}
                  className="favorites-page__remove"
                  aria-label="წაშლა"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={showRemoveConfirm}
        title="წაშლის დადასტურება"
        message="დარწმუნებული ხართ, რომ გსურთ ამ პროდუქტის წაშლა ფავორიტებიდან?"
        confirmLabel="წაშლა"
        cancelLabel="გაუქმება"
        onConfirm={handleRemoveConfirm}
        onCancel={handleRemoveCancel}
      />
    </PageContainer>
  )
}
