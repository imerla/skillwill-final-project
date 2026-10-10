import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCategory, getProducts, getProduct } from './api/catalog'
import { CATALOG_CATEGORY_SLUG } from './config'
import type { ProductsQuery } from './types'

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: ({ signal }) => getCategory(slug!, signal),
    enabled: !!slug,
  })
}

export function useProducts(params: ProductsQuery, options?: { enabled?: boolean }) {
  const {
    q,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    onSale,
    sort,
    page,
    limit,
    ...attributeFilters
  } = params

  // Always use the configured category - ignore any user-provided category
  const queryWithCategory: ProductsQuery = {
    category: CATALOG_CATEGORY_SLUG,
    q,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    onSale,
    sort,
    page,
    limit,
    ...attributeFilters,
  }

  // Build a stable key for attribute filters by sorting keys
  const attributeFilterKey = Object.keys(attributeFilters)
    .sort()
    .map((key) => `${key}:${attributeFilters[key]}`)
    .join('|')

  return useQuery({
    queryKey: [
      'products',
      CATALOG_CATEGORY_SLUG,
      q,
      brand,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      onSale,
      sort,
      page,
      limit,
      attributeFilterKey,
    ],
    queryFn: ({ signal }) => getProducts(queryWithCategory, signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: ({ signal }) => getProduct(slug!, signal),
    enabled: !!slug,
  })
}

