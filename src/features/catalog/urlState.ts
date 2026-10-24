import type { ProductsQuery, CategoryFilter } from './types'

export function parseUrlParams(searchParams: URLSearchParams, categoryFilters?: CategoryFilter[]): ProductsQuery {
  const params: ProductsQuery = {}
  const validFilterKeys = new Set(categoryFilters?.map((f) => f.key) || [])

  for (const [key, value] of searchParams.entries()) {
    if (!value) continue

    if (key === 'category') {
      continue
    }

    if (key === 'price') {
      continue
    }

    if (key === 'q') {
      params[key] = value
    } else if (key === 'sort') {
      params[key] = value as ProductsQuery['sort']
    } else if (key === 'minPrice' || key === 'maxPrice' || key === 'minRating') {
      const num = parseFloat(value)
      if (!isNaN(num) && String(num) === value) {
        params[key] = num
      }
    } else if (key === 'inStock' || key === 'onSale') {
      params[key] = value === 'true'
    } else if (key === 'page' || key === 'limit') {
      const num = parseInt(value, 10)
      if (!isNaN(num) && num >= 1 && String(num) === value) {
        params[key] = num
      }
    } else if (validFilterKeys.has(key)) {
      params[key] = value
    }
  }

  return params
}

export function serializeUrlParams(params: ProductsQuery): URLSearchParams {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    if (typeof value === 'boolean') {
      searchParams.set(key, value ? 'true' : 'false')
    } else if (typeof value === 'number') {
      searchParams.set(key, String(value))
    } else {
      searchParams.set(key, value)
    }
  }

  return searchParams
}

export function updateUrlParams(
  currentParams: ProductsQuery,
  updates: Partial<ProductsQuery>,
  resetPage: boolean = false
): ProductsQuery {
  const newParams = { ...currentParams, ...updates }

  if (resetPage) {
    newParams.page = 1
  }

  // Remove undefined values
  Object.keys(newParams).forEach((key) => {
    if (newParams[key as keyof ProductsQuery] === undefined) {
      delete newParams[key as keyof ProductsQuery]
    }
  })

  return newParams
}

