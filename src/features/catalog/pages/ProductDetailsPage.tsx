import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Heart, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useProduct } from '../hooks'
import { useSession } from '../../../shared/auth'
import { useAddToCart, useUpdateCartItemQuantity, useRemoveCartItem, useCart } from '../../cart/hooks'
import { useAddToFavorites, useRemoveFromFavorites, useFavorites } from '../../favorites/hooks'
import { getCartErrorMessage } from '../../cart/errors'
import { CATALOG_CATEGORY_SLUG } from '../config'
import { ProductCard } from '../components/ProductCard'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Breadcrumbs } from '../../../shared/ui/Breadcrumbs/Breadcrumbs'
import { Button } from '../../../shared/ui/Button/Button'
import { Alert } from '../../../shared/ui/Alert/Alert'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { Price } from '../../../shared/ui/Price/Price'
import { Rating } from '../../../shared/ui/Rating/Rating'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { QuantityStepper } from '../../../shared/ui/QuantityStepper/QuantityStepper'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { translateCategoryName, translateSpecKey, translateSpecValue } from '../../../shared/i18n/apiTranslations'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import './ProductDetailsPage.css'

export function ProductDetailsPage() {
  const { t } = useLanguage()
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading, error, refetch } = useProduct(slug)
  const { isAuthenticated } = useSession()
  const addToCart = useAddToCart()
  const updateQuantity = useUpdateCartItemQuantity()
  const removeFromCart = useRemoveCartItem()
  const { data: cart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  // Favorites
  const { data: favorites } = useFavorites()
  const addToFavorites = useAddToFavorites()
  const removeFromFavorites = useRemoveFromFavorites()

  // Get cart item for this product if it exists
  const cartItem = cart?.items.find((item) => item.productId === product?.id)
  const cartQuantity = cartItem?.qty ?? 0

  // Check if product is favorited
  const getStoredFavoriteIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem('favorites_ids')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  }
  const isFavorite = favorites?.items.some((f) => f.productId === product?.id) ?? getStoredFavoriteIds().has(product?.id ?? '')

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addToCartMessage, setAddToCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const handleLightboxOpen = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }, [])

  const handleLightboxClose = useCallback(() => {
    setLightboxOpen(false)
    document.body.style.overflow = ''
  }, [])

  const handleLightboxNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % (product?.images?.length ?? 1))
  }, [product?.images?.length])

  const handleLightboxPrev = useCallback(() => {
    const len = product?.images?.length ?? 1
    setLightboxIndex((prev) => (prev - 1 + len) % len)
  }, [product?.images?.length])

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return

      if (e.key === 'Escape') {
        handleLightboxClose()
      } else if (e.key === 'ArrowLeft') {
        handleLightboxPrev()
      } else if (e.key === 'ArrowRight') {
        handleLightboxNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, handleLightboxNext, handleLightboxPrev, handleLightboxClose])

  // Timer ref for auto-dismissing messages
  const messageTimerRef = useRef<number | null>(null)

  useDocumentTitle(product?.title ?? t.common.loading)

  // Track previous slug to detect when product changes
  const prevSlugRef = useRef(slug)
  useEffect(() => {
    if (prevSlugRef.current !== slug) {
      setSelectedImageIndex(0)
      setQuantity(1)
      prevSlugRef.current = slug
    }
  }, [slug])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (messageTimerRef.current !== null) {
        clearTimeout(messageTimerRef.current)
      }
    }
  }, [])

  const handleAddToCart = () => {
    if (!product) {
      return
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    if (!product.inStock || product.stock === 0) {
      setAddToCartMessage({ type: 'error', text: t.product.outOfStockMessage })
      // Clear previous timer
      if (messageTimerRef.current !== null) {
        clearTimeout(messageTimerRef.current)
      }
      // Set new timer
      messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
      return
    }

    // Check if adding this quantity would exceed stock (considering existing cart quantity)
    const totalQuantity = quantity + cartQuantity
    if (totalQuantity > product.stock) {
      // Notify user that requested quantity exceeds available stock
      setAddToCartMessage({ type: 'error', text: `${t.cart.stockChanged} ${t.cart.onlyN(product.stock - cartQuantity)}` })
      // Clear previous timer
      if (messageTimerRef.current !== null) {
        clearTimeout(messageTimerRef.current)
      }
      // Set new timer
      messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
      // Don't add to cart if total quantity would exceed stock
      return
    }

    addToCart.mutate(
      { productId: product.id, qty: quantity },
      {
        onSuccess: () => {
          setAddToCartMessage({ type: 'success', text: t.product.added })
          setQuantity(1)
          // Clear previous timer
          if (messageTimerRef.current !== null) {
            clearTimeout(messageTimerRef.current)
          }
          // Set new timer
          messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
        },
        onError: (error) => {
          setAddToCartMessage({ type: 'error', text: getCartErrorMessage(error, t, { stock: product?.stock ?? 0 }) })
          // Clear previous timer
          if (messageTimerRef.current !== null) {
            clearTimeout(messageTimerRef.current)
          }
          // Set new timer
          messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
        }
      }
    )
  }

  const handleUpdateQuantity = (newQty: number) => {
    if (!cartItem || !product) return

    if (newQty === 0) {
      handleRemoveFromCart()
      return
    }

    // Validate against stock
    if (newQty > product.stock) {
      setAddToCartMessage({ type: 'error', text: `${t.cart.stockChanged} ${t.cart.onlyN(product.stock)}` })
      // Clear previous timer
      if (messageTimerRef.current !== null) {
        clearTimeout(messageTimerRef.current)
      }
      // Set new timer
      messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
      // Don't call mutation if quantity exceeds stock
      return
    }

    updateQuantity.mutate(
      { id: cartItem.id, data: { qty: newQty } },
      {
        onSuccess: () => {
          setAddToCartMessage({ type: 'success', text: t.product.quantityUpdated })
          // Clear previous timer
          if (messageTimerRef.current !== null) {
            clearTimeout(messageTimerRef.current)
          }
          // Set new timer
          messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
        },
        onError: (error) => {
          setAddToCartMessage({ type: 'error', text: getCartErrorMessage(error, t, { stock: product?.stock ?? 0 }) })
          // Clear previous timer
          if (messageTimerRef.current !== null) {
            clearTimeout(messageTimerRef.current)
          }
          // Set new timer
          messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
        }
      }
    )
  }

  const handleToggleFavorite = () => {
    if (!product) return
    if (isFavorite) {
      removeFromFavorites.mutate(product.id)
    } else {
      addToFavorites.mutate(product.id)
    }
  }

  const handleRemoveFromCart = () => {
    if (!cartItem) return

    removeFromCart.mutate(cartItem.id, {
      onSuccess: () => {
        setAddToCartMessage({ type: 'success', text: t.cart.itemGone })
        // Clear previous timer
        if (messageTimerRef.current !== null) {
          clearTimeout(messageTimerRef.current)
        }
        // Set new timer
        messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
      },
      onError: () => {
        setAddToCartMessage({ type: 'error', text: t.cart.remove })
        // Clear previous timer
        if (messageTimerRef.current !== null) {
          clearTimeout(messageTimerRef.current)
        }
        // Set new timer
        messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
      }
    })
  }

  if (!slug) {
    return (
      <PageContainer size="page" as="section">
        <ErrorState onAction={() => navigate(ROUTES.catalog)} />
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

  if (isLoading || !product) {
    return (
      <PageContainer size="page" as="section">
        <div className="product-details-page__skeleton">
          <div className="product-details-page__skeleton-gallery">
            <Skeleton variant="rect" className="product-details-page__skeleton-main-image" />
            <div className="product-details-page__skeleton-thumbnails">
              <Skeleton variant="rect" className="product-details-page__skeleton-thumbnail" />
              <Skeleton variant="rect" className="product-details-page__skeleton-thumbnail" />
              <Skeleton variant="rect" className="product-details-page__skeleton-thumbnail" />
            </div>
          </div>
          <div className="product-details-page__skeleton-info">
            <Skeleton variant="text" className="product-details-page__skeleton-brand" />
            <Skeleton variant="text" className="product-details-page__skeleton-title" />
            <Skeleton variant="text" className="product-details-page__skeleton-price" />
            <Skeleton variant="text" className="product-details-page__skeleton-rating" />
            <Skeleton variant="rect" className="product-details-page__skeleton-stock" />
            <Skeleton variant="rect" className="product-details-page__skeleton-button" />
            <Skeleton variant="text" className="product-details-page__skeleton-warranty" />
          </div>
        </div>
      </PageContainer>
    )
  }

  // Validate product belongs to clothing category
  if (product.category.slug !== CATALOG_CATEGORY_SLUG) {
    return (
      <PageContainer size="page" as="section">
        <EmptyState
          title={t.product.notAvailable}
          actionLabel={t.product.backToCatalog}
          onAction={() => navigate(ROUTES.catalog)}
        />
      </PageContainer>
    )
  }

  const { images, title, brand, price, oldPrice, discountPercent, currency, rating, reviewsCount, stock, inStock, warrantyMonths, specs, related } = product

  // Safety check for empty images array
  const hasImages = images && images.length > 0
  const currentImage = hasImages ? images[selectedImageIndex] : undefined

  return (
    <PageContainer size="page" as="section">

      <Breadcrumbs
        items={[
          { label: t.nav.products, href: ROUTES.catalog },
          { label: translateCategoryName(product.category.name, t), href: ROUTES.catalog },
          { label: product.title }
        ]}
      />
      <div className="product-details-page">
        {/* Gallery */}
        <div className="product-details-page__gallery">
          <div className="product-details-page__main-image">
            {currentImage ? (
              <img
                src={currentImage}
                alt={t.product.imageAlt(title, selectedImageIndex + 1)}
                className="product-details-page__main-image-img"
                onClick={() => handleLightboxOpen(selectedImageIndex)}
                style={{ cursor: 'zoom-in' }}
              />
            ) : (
              <div className="product-details-page__main-image-placeholder">
                {t.product.noImage}
              </div>
            )}
            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className={`product-details-page__favorite ${isFavorite ? 'product-details-page__favorite--active' : ''}`}
              aria-label={isFavorite ? t.product.removeFromFavorites : t.product.addToFavorites}
            >
              <Heart size={20} fill={isFavorite ? 'var(--color-primary)' : 'none'} />
            </button>
          </div>
          {hasImages && images.length > 1 && (
            <div className="product-details-page__thumbnails">
              {images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`product-details-page__thumbnail ${index === selectedImageIndex ? 'product-details-page__thumbnail--active' : ''}`}
                  aria-label={t.product.viewImage(index + 1)}
                  aria-current={index === selectedImageIndex ? 'true' : undefined}
                >
                  <img
                    src={image}
                    alt={t.product.thumbAlt(title, index + 1)}
                    className="product-details-page__thumbnail-img"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="product-details-page__info">
          <p className="product-details-page__brand">{brand}</p>
          <h1 className="product-details-page__title">{title}</h1>

          <Rating value={rating} count={reviewsCount} />

          <Price
            value={price}
            oldValue={oldPrice ?? undefined}
            discountPercent={discountPercent ?? undefined}
            currency={currency}
            size="lg"
          />

          <div className="product-details-page__stock">
            <Badge variant={inStock ? 'success' : 'danger'}>
              {inStock ? t.product.inStockCount(stock) : t.product.outOfStock}
            </Badge>
          </div>

          {/* Cart Status */}
          {cartQuantity > 0 && (
            <div className="product-details-page__cart-status">
              <span className="product-details-page__cart-status-text">
                {t.cart.itemsCount(cartQuantity)} {t.catalog.inCart}
              </span>
            </div>
          )}

          {/* Quantity Selector for Add to Cart */}
          {inStock && cartQuantity === 0 && (
            <div className="product-details-page__quantity">
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={stock}
                disabled={addToCart.isPending}
              />
            </div>
          )}

          {/* Quantity Selector for Update Cart */}
          {cartQuantity > 0 && (
            <div className="product-details-page__quantity">
              <QuantityStepper
                value={cartQuantity}
                onChange={handleUpdateQuantity}
                min={0}
                max={stock}
                disabled={updateQuantity.isPending}
              />
            </div>
          )}

          {/* Add to Cart Button (only show if not in cart) */}
          {cartQuantity === 0 && (
            <Button
              loading={addToCart.isPending}
              disabled={!inStock}
              onClick={handleAddToCart}
              className="product-details-page__add-to-cart"
            >
              {t.product.addToCart}
            </Button>
          )}

          {/* Update in Cart Badge (only show if in cart) */}
          {cartQuantity > 0 && (
            <Button
              loading={updateQuantity.isPending || removeFromCart.isPending}
              disabled={!inStock}
              onClick={() => navigate(ROUTES.cart)}
              className="product-details-page__add-to-cart product-details-page__add-to-cart--secondary"
              variant="secondary"
            >
              {t.catalog.goToCart}
            </Button>
          )}

          {addToCartMessage && (
            <Alert
              variant={addToCartMessage.type}
              message={addToCartMessage.text}
              className="product-details-page__message"
            />
          )}

          {warrantyMonths > 0 && (
            <p className="product-details-page__warranty">
              {t.product.warranty(warrantyMonths)}
            </p>
          )}

          {/* Specs */}
          {specs && Object.keys(specs).length > 0 && (
            <table className="product-details-page__table">
              <caption className="visually-hidden">{t.product.specs}</caption>
              <tbody>
                {Object.entries(specs).map(([key, value]) => (
                  <tr key={key}>
                    <th scope="row">{translateSpecKey(key, t)}</th>
                    <td>{translateSpecValue(value, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Related Products */}
        {related && related.length > 0 && (
          <div className="product-details-page__related">
            <h2 className="product-details-page__section-title">{t.product.related}</h2>
            <div className="product-details-page__related-grid">
              {related
                .filter((relatedProduct) => relatedProduct.category.slug === CATALOG_CATEGORY_SLUG)
                .map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && images && images.length > 0 && (
        <div className="product-details-page__lightbox" onClick={handleLightboxClose}>
          <button
            className="product-details-page__lightbox-close"
            onClick={handleLightboxClose}
            aria-label={t.product.close}
          >
            <X size={24} />
          </button>
          <button
            className="product-details-page__lightbox-nav product-details-page__lightbox-nav--prev"
            onClick={(e) => { e.stopPropagation(); handleLightboxPrev() }}
            aria-label={t.product.prevImage}
          >
            <ChevronLeft size={32} />
          </button>
          <img
            src={images[lightboxIndex]}
            alt={`${title} - ${lightboxIndex + 1}`}
            className="product-details-page__lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="product-details-page__lightbox-nav product-details-page__lightbox-nav--next"
            onClick={(e) => { e.stopPropagation(); handleLightboxNext() }}
            aria-label={t.product.nextImage}
          >
            <ChevronRight size={32} />
          </button>
          <div className="product-details-page__lightbox-counter">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
