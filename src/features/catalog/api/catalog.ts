import { api } from '../../../shared/api'
import type {
  Category,
  ProductDetails,
  ProductsQuery,
  ProductsResponse,
} from '../types'

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    if (typeof value === 'boolean') {
      searchParams.append(key, value ? 'true' : 'false')
    } else if (typeof value === 'number' || typeof value === 'string') {
      searchParams.append(key, String(value))
    }
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export async function getCategory(slug: string, signal?: AbortSignal): Promise<Category> {
  return api.get<Category>(`/categories/${slug}`, signal ? { signal } : undefined)
}

export async function getProducts(query: ProductsQuery = {}, signal?: AbortSignal): Promise<ProductsResponse> {
  const queryString = buildQueryString(query)
  return api.get<ProductsResponse>(`/products${queryString}`, signal ? { signal } : undefined)
}

export async function getProduct(slug: string, signal?: AbortSignal): Promise<ProductDetails> {
  return api.get<ProductDetails>(`/products/${slug}`, signal ? { signal } : undefined)
}

