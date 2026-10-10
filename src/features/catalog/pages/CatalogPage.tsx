import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCategory, useProducts } from '../hooks'
import { CATALOG_CATEGORY_SLUG } from '../config'
import { parseUrlParams, serializeUrlParams, updateUrlParams } from '../urlState'
import type { ProductSort } from '../types'
import { ProductCard } from '../components/ProductCard'
import { Filter } from '../components/Filter'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Input } from '../../../shared/ui/Input/Input'
import { Select } from '../../../shared/ui/Select/Select'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { Pagination } from '../../../shared/ui/Pagination/Pagination'
import { ka } from '../../../shared/i18n/ka'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import './CatalogPage.css'

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = CATALOG_CATEGORY_SLUG

  const { data: category, isLoading: categoryLoading, error: categoryError, refetch: refetchCategory } = useCategory(categorySlug)
  const params = parseUrlParams(searchParams, category?.filters)
  const { data: productsData, isPending: productsPending, isFetching: productsFetching, error: productsError, refetch: refetchProducts } = useProducts(params, { enabled: !categoryLoading })

  useDocumentTitle(category?.name ?? ka.catalog.titleFallback)

  // Use server response page as authoritative current page
  const currentPage = productsData?.page ?? 1

  // Initialize search input from URL params
  const [searchInput, setSearchInput] = useState(params.q || '')

  // Use ref to store current params to avoid callback dependency in debounce
  const paramsRef = useRef(params)
  useEffect(() => {
    paramsRef.current = params
  }, [params])

  // Track whether update is from user typing vs URL navigation
  const isUserTypingRef = useRef(false)

  // Ref for results wrapper to scroll on page change
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleUpdateParams = useCallback((updates: Parameters<typeof updateUrlParams>[1], resetPage = true) => {
    const newParams = updateUrlParams(paramsRef.current, updates, resetPage)
    setSearchParams(serializeUrlParams(newParams))
  }, [setSearchParams])

  // Sync search input with URL when params change (e.g., Back/Forward)
  useEffect(() => {
    if (!isUserTypingRef.current) {
      setSearchInput(params.q || '')
    }
  }, [params.q])

  // Debounced search update - capture current params at time of typing
  useEffect(() => {
    if (searchInput === (paramsRef.current.q ?? '')) return
    const timer = setTimeout(() => {
      handleUpdateParams({ q: searchInput || undefined })
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, handleUpdateParams])

  const handlePageChange = (page: number) => {
    handleUpdateParams({ page }, false)
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleFilterChange = (key: string, value: string) => {
    handleUpdateParams({ [key]: value || undefined })
  }

  const handleFilterClear = (key: string) => {
    // Special handling for price filter - clear both minPrice and maxPrice
    if (key === 'price') {
      handleUpdateParams({ minPrice: undefined, maxPrice: undefined })
    } else {
      handleUpdateParams({ [key]: undefined })
    }
  }

  const handlePriceRangeChange = (min?: number, max?: number) => {
    // Validate: min should not be greater than max
    if (min !== undefined && max !== undefined && min > max) {
      // Don't send invalid range - user needs to fix it
      return
    }
    handleUpdateParams({ minPrice: min, maxPrice: max })
  }

  const handleClearAll = () => {
    // Clear search, filters, and reset to page 1
    const clearedParams: Record<string, undefined> = {
      q: undefined,
      sort: undefined,
      page: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      inStock: undefined,
      onSale: undefined
    }
    // Clear all attribute filters
    category?.filters?.forEach((filter) => {
      clearedParams[filter.key] = undefined
    })
    handleUpdateParams(clearedParams, true)
  }

  return (
    <PageContainer size="page" as="section">
      {/* Header/Search Area */}
      <div className="catalog-page__header">
        <h1 className="catalog-page__title">
          {categoryLoading ? ka.common.loading : category?.name || ka.catalog.titleFallback}
        </h1>
        <Input
          type="search"
          placeholder={ka.catalog.searchPlaceholder}
          value={searchInput}
          onChange={(e) => {
            isUserTypingRef.current = true
            setSearchInput(e.target.value)
          }}
          aria-label={ka.catalog.searchLabel}
          className="catalog-page__search"
        />
      </div>

      {/* Sorting Area */}
      <div className="catalog-page__sorting">
        <Select
          label={ka.catalog.sortLabel}
          value={params.sort as string || ''}
          onChange={(e) => handleUpdateParams({ sort: (e.target.value || undefined) as ProductSort | undefined })}
          className="catalog-page__sort"
        >
          <option value="">{ka.catalog.sortPlaceholder}</option>
          <option value="newest">{ka.catalog.sort.newest}</option>
          <option value="oldest">{ka.catalog.sort.oldest}</option>
          <option value="price-asc">{ka.catalog.sort['price-asc']}</option>
          <option value="price-desc">{ka.catalog.sort['price-desc']}</option>
          <option value="rating-desc">{ka.catalog.sort['rating-desc']}</option>
          <option value="popular">{ka.catalog.sort.popular}</option>
          <option value="title-asc">{ka.catalog.sort['title-asc']}</option>
        </Select>
      </div>

      {/* Filters and Products Container */}
      <div className="catalog-page__content">
        {/* Filters Area */}
        <div className="catalog-page__filters">
          <div className="catalog-page__filter-section">
            <h3 className="catalog-page__filter-title">{ka.catalog.filters}</h3>
            {categoryError ? (
              <ErrorState onAction={() => refetchCategory()} />
            ) : category?.filters?.map((filter) => (
              <Filter
                key={filter.key}
                filter={filter}
                selectedValues={(params[filter.key] as string) || ''}
                onChange={handleFilterChange}
                onClear={handleFilterClear}
                minValue={filter.key === 'price' ? params.minPrice : undefined}
                maxValue={filter.key === 'price' ? params.maxPrice : undefined}
                onRangeChange={filter.key === 'price' ? handlePriceRangeChange : undefined}
              />
            ))}
          </div>
        </div>

        {/* Product Grid Area */}
        <div className={`catalog-page__products ${productsFetching && productsData ? 'catalog-page__products--fetching' : ''}`} ref={resultsRef}>
          {productsError && !productsData ? (
            <ErrorState onAction={() => refetchProducts()} />
          ) : productsPending && !productsData && !productsError ? (
            <div className="catalog-page__grid" aria-busy="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="catalog-page__skeleton-card">
                  <Skeleton variant="rect" className="catalog-page__skeleton-image" />
                  <Skeleton variant="text" className="catalog-page__skeleton-title" />
                  <Skeleton variant="text" className="catalog-page__skeleton-brand" />
                  <Skeleton variant="text" className="catalog-page__skeleton-price" />
                </div>
              ))}
            </div>
          ) : productsData?.items && productsData.items.length === 0 ? (
            <EmptyState
              title={ka.catalog.empty}
              actionLabel={ka.catalog.clearAll}
              onAction={handleClearAll}
            />
          ) : (
            <>
              {productsData && productsData.items.length > 0 && (
                <p className="catalog-page__results" aria-live="polite">
                  {ka.catalog.pageRange((currentPage - 1) * productsData.limit + 1, Math.min(currentPage * productsData.limit, productsData.total), productsData.total)}
                </p>
              )}
              <div className="catalog-page__grid">
                {productsData?.items?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pagination Area */}
      {productsData && productsData.totalPages > 1 && (
        <Pagination
          page={currentPage}
          totalPages={productsData.totalPages}
          onPageChange={handlePageChange}
          disabled={productsFetching}
        />
      )}
    </PageContainer>
  )
}

