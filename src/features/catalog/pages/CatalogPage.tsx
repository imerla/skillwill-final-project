import { useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCategory, useProducts } from '../hooks'
import { CATALOG_CATEGORY_SLUG } from '../config'
import { parseUrlParams, serializeUrlParams, updateUrlParams } from '../urlState'
import type { ProductSort } from '../types'
import { ProductCard } from '../components/ProductCard'
import { Filter } from '../components/Filter'
import { CategoryBanner } from '../components/CategoryBanner'
import { ActiveFilters } from '../components/ActiveFilters'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Select } from '../../../shared/ui/Select/Select'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { Pagination } from '../../../shared/ui/Pagination/Pagination'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { translateFilterLabel, translateFilterOption } from '../../../shared/i18n/apiTranslations'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import './CatalogPage.css'

export function CatalogPage() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = CATALOG_CATEGORY_SLUG
  const { data: category, isLoading: categoryLoading, error: categoryError, refetch: refetchCategory } = useCategory(categorySlug)

  // პარამეტრების პარსინგი ფილტრების ობიექტისთვის
  const params = parseUrlParams(searchParams, category?.filters)
  const lastProcessedSearchRef = useRef('')

  // Auto-apply filter when search term matches filter options (supports multiple keywords)
  useEffect(() => {
    if (!category?.filters || !params.q) return

    const searchTerm = params.q.toLowerCase().trim()
    if (searchTerm === lastProcessedSearchRef.current) return
    lastProcessedSearchRef.current = searchTerm

    // Split search term into keywords
    const keywords = searchTerm.split(/\s+/).filter(Boolean)
    const matchedFilters: Record<string, string> = {}

    keywords.forEach((keyword) => {
      category.filters.forEach((filter) => {
        if (!filter.options || matchedFilters[filter.key]) return // skip if already matched

        const matchedOption = filter.options.find((option) => {
          const labelLower = option.label.toLowerCase()
          const valueLower = option.value.toLowerCase()
          const translatedLabel = translateFilterOption(option.label, t).toLowerCase()

          // EXACT match for each keyword
          return (
            labelLower === keyword ||
            valueLower === keyword ||
            translatedLabel === keyword
          )
        })

        if (matchedOption) {
          matchedFilters[filter.key] = matchedOption.value
        }
      })
    })

    // If search term matches any filters, clear all filters and add only the new ones
    if (Object.keys(matchedFilters).length > 0) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.delete('q')
        newParams.set('page', '1')
        // Clear all existing filters except page
        newParams.forEach((_, key) => {
          if (key !== 'page') {
            newParams.delete(key)
          }
        })
        // Add only the new matched filters
        Object.entries(matchedFilters).forEach(([key, val]) => {
          newParams.set(key, val)
        })
        return newParams
      }, { replace: true })
    }
  }, [params.q, category?.filters, setSearchParams, t])

  const { data: productsData, isPending: productsPending, isFetching: productsFetching, error: productsError, refetch: refetchProducts } = useProducts(params, { enabled: !categoryLoading })

  useDocumentTitle(category?.name ?? t.catalog.titleFallback)

  const currentPage = productsData?.page ?? 1
  const resultsRef = useRef<HTMLDivElement>(null)

  // 2. ფიქსი: URL პარამეტრების განახლების ფუნქცია ფუნქციონალური setSearchParams-ით
  const handleUpdateParams = useCallback((updates: Parameters<typeof updateUrlParams>[1], resetPage = true) => {
    setSearchParams((prevSearchParams) => {
      // ვიღებთ მიმდინარე აქტუალურ პარამეტრებს პირდაპირ React-ის სთეითიდან
      const currentParamsParsed = parseUrlParams(prevSearchParams, category?.filters)
      const newParamsObj = updateUrlParams(currentParamsParsed, updates, resetPage)
      return serializeUrlParams(newParamsObj)
    })
  }, [category?.filters, setSearchParams])

  const handlePageChange = (page: number) => {
    handleUpdateParams({ page }, false)
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleFilterChange = (key: string, value: string) => {
    handleUpdateParams({ [key]: value || undefined })
  }

  const handleFilterClear = (key: string, value?: string) => {
    if (value) {
      const currentValue = params[key] as string
      const currentSet = new Set(currentValue.split(',').filter(Boolean))
      currentSet.delete(value)
      const newValue = Array.from(currentSet).join(',')
      handleUpdateParams({ [key]: newValue || undefined })
      return
    }

    if (key === 'price') {
      handleUpdateParams({ minPrice: undefined, maxPrice: undefined })
    } else if (key === 'q') {
      handleUpdateParams({ q: undefined })
    } else if (key === 'sort') {
      handleUpdateParams({ sort: undefined })
    } else if (key === 'inStock') {
      handleUpdateParams({ inStock: undefined })
    } else if (key === 'onSale') {
      handleUpdateParams({ onSale: undefined })
    } else {
      handleUpdateParams({ [key]: undefined })
    }
  }

  const handlePriceRangeChange = (min?: number, max?: number) => {
    if (min !== undefined && max !== undefined && min > max) return
    handleUpdateParams({ minPrice: min, maxPrice: max })
  }

  const handleClearAll = () => {
    const clearedParams: Record<string, undefined> = {
      q: undefined, sort: undefined, page: undefined,
      minPrice: undefined, maxPrice: undefined, minRating: undefined,
      inStock: undefined, onSale: undefined
    }
    category?.filters?.forEach((filter) => {
      clearedParams[filter.key] = undefined
    })
    handleUpdateParams(clearedParams, true)
  }

  return (
    <PageContainer size="page" as="section">
      {!categoryLoading && category && <CategoryBanner category={category} />}

      {categoryLoading && (
        <div className="catalog-page__header">
          <h1 className="catalog-page__title">{t.common.loading}</h1>
        </div>
      )}

      <div className="catalog-page__sorting">
        <Select
          label={t.catalog.sortLabel}
          value={params.sort as string || ''}
          onChange={(e) => handleUpdateParams({ sort: (e.target.value || undefined) as ProductSort | undefined })}
          className="catalog-page__sort"
        >
          <option value="">{t.catalog.sortPlaceholder}</option>
          <option value="newest">{t.catalog.sort.newest}</option>
          <option value="oldest">{t.catalog.sort.oldest}</option>
          <option value="price-asc">{t.catalog.sort['price-asc']}</option>
          <option value="price-desc">{t.catalog.sort['price-desc']}</option>
          <option value="rating-desc">{t.catalog.sort['rating-desc']}</option>
          <option value="popular">{t.catalog.sort.popular}</option>
          <option value="title-asc">{t.catalog.sort['title-asc']}</option>
        </Select>
      </div>

      <ActiveFilters category={category} params={params} onClearFilter={handleFilterClear} onClearAll={handleClearAll} t={t} />

      <div className="catalog-page__content">
        <div className="catalog-page__filters">
          <div className="catalog-page__filter-section">
            <h3 className="catalog-page__filter-title">{t.catalog.filters}</h3>
            {categoryError ? (
              <ErrorState onAction={() => refetchCategory()} />
            ) : category?.filters?.sort((a, b) => {
              const aTranslated = translateFilterLabel(a.label, t)
              const bTranslated = translateFilterLabel(b.label, t)
              if (aTranslated === t.api.forWhom) return -1
              if (bTranslated === t.api.forWhom) return 1
              return 0
            }).map((filter) => (
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
              title={t.catalog.empty}
              description={params.q ? t.catalog.emptySearchSuggestion : undefined}
              actionLabel={t.catalog.clearAll}
              onAction={handleClearAll}
              illustration={params.q ? 'search' : 'package'}
            />
          ) : (
            <>
              {productsData && productsData.items.length > 0 && (
                <p className="catalog-page__results" aria-live="polite">
                  {t.catalog.pageRange((currentPage - 1) * productsData.limit + 1, Math.min(currentPage * productsData.limit, productsData.total), productsData.total)}
                </p>
              )}
              <div className="catalog-page__grid">
                {productsData?.items?.map((product) => (
                  <ProductCard key={product.id} product={product} t={t} />
                ))}
              </div>
              {productsData && productsData.totalPages > 1 && (
                <div className="catalog-page__pagination">
                  <Pagination
                    page={currentPage}
                    totalPages={productsData.totalPages}
                    onPageChange={handlePageChange}
                    disabled={productsFetching}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
