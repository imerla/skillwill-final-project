import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useProduct } from '../hooks'
import { useSession } from '../../../shared/auth'
import { useAddToCart } from '../../cart/hooks'
import { getCartErrorMessage } from '../../cart/errors'
import { CATALOG_CATEGORY_SLUG } from '../config'
import { ProductCard } from '../components/ProductCard'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { Alert } from '../../../shared/ui/Alert/Alert'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { Price } from '../../../shared/ui/Price/Price'
import { Rating } from '../../../shared/ui/Rating/Rating'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { ka } from '../../../shared/i18n/ka'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import './ProductDetailsPage.css'

export function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading, error, refetch } = useProduct(slug)
  const { isAuthenticated } = useSession()
  const addToCart = useAddToCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [addToCartMessage, setAddToCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Timer ref for auto-dismissing messages
  const messageTimerRef = useRef<number | null>(null)

  useDocumentTitle(product?.title ?? ka.common.loading)

  // Track previous slug to detect when product changes
  const prevSlugRef = useRef(slug)
  useEffect(() => {
    if (prevSlugRef.current !== slug) {
      setSelectedImageIndex(0)
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
      setAddToCartMessage({ type: 'error', text: ka.product.outOfStockMessage })
      // Clear previous timer
      if (messageTimerRef.current !== null) {
        clearTimeout(messageTimerRef.current)
      }
      // Set new timer
      messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
      return
    }

    addToCart.mutate(
      { productId: product.id, qty: 1 },
      {
        onSuccess: () => {
          setAddToCartMessage({ type: 'success', text: ka.product.added })
          // Clear previous timer
          if (messageTimerRef.current !== null) {
            clearTimeout(messageTimerRef.current)
          }
          // Set new timer
          messageTimerRef.current = window.setTimeout(() => setAddToCartMessage(null), 3000)
        },
        onError: (error) => {
          setAddToCartMessage({ type: 'error', text: getCartErrorMessage(error, { stock: product.stock }) })
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
          title={ka.product.notAvailable}
          actionLabel={ka.product.backToCatalog}
          onAction={() => navigate(ROUTES.catalog)}
        />
      </PageContainer>
    )
  }

  const { images, title, brand, price, oldPrice, discountPercent, currency, rating, reviewsCount, stock, inStock, warrantyMonths, specs, attributes, related } = product

  // Safety check for empty images array
  const hasImages = images && images.length > 0
  const currentImage = hasImages ? images[selectedImageIndex] : undefined

  return (
    <PageContainer size="page" as="section">
      <div className="product-details-page">
        {/* Gallery */}
        <div className="product-details-page__gallery">
          <div className="product-details-page__main-image">
            {currentImage ? (
              <img
                src={currentImage}
                alt={ka.product.imageAlt(title, selectedImageIndex + 1)}
                className="product-details-page__main-image-img"
              />
            ) : (
              <div className="product-details-page__main-image-placeholder">
                {ka.product.noImage}
              </div>
            )}
          </div>
          {hasImages && images.length > 1 && (
            <div className="product-details-page__thumbnails">
              {images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`product-details-page__thumbnail ${index === selectedImageIndex ? 'product-details-page__thumbnail--active' : ''}`}
                  aria-label={ka.product.viewImage(index + 1)}
                  aria-current={index === selectedImageIndex ? 'true' : undefined}
                >
                  <img
                    src={image}
                    alt={ka.product.thumbAlt(title, index + 1)}
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
              {inStock ? ka.product.inStockCount(stock) : ka.product.outOfStock}
            </Badge>
          </div>

          {/* Add to Cart */}
          <Button
            loading={addToCart.isPending}
            disabled={!inStock}
            onClick={handleAddToCart}
            className="product-details-page__add-to-cart"
          >
            {ka.product.addToCart}
          </Button>

          {addToCartMessage && (
            <Alert
              variant={addToCartMessage.type}
              message={addToCartMessage.text}
              className="product-details-page__message"
            />
          )}

          {warrantyMonths > 0 && (
            <p className="product-details-page__warranty">
              {ka.product.warranty(warrantyMonths)}
            </p>
          )}

          {/* Specs */}
          {specs && Object.keys(specs).length > 0 && (
            <table className="product-details-page__table">
              <caption className="visually-hidden">{ka.product.specs}</caption>
              <tbody>
                {Object.entries(specs).map(([key, value]) => (
                  <tr key={key}>
                    <th scope="row">{key}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Attributes */}
          {attributes && Object.keys(attributes).length > 0 && (
            <table className="product-details-page__table">
              <caption className="visually-hidden">{ka.product.attributes}</caption>
              <tbody>
                {Object.entries(attributes).map(([key, value]) => (
                  <tr key={key}>
                    <th scope="row">{key}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Related Products */}
        {related && related.length > 0 && (
          <div className="product-details-page__related">
            <h2 className="product-details-page__section-title">{ka.product.related}</h2>
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
    </PageContainer>
  )
}

