export interface Product {
  id: string
  slug: string
  title: string
  description: string
  brand: string
  price: number
  oldPrice: number | null
  discountPercent: number | null
  currency: string
  rating: number
  reviewsCount: number
  stock: number
  inStock: boolean
  warrantyMonths: number
  image: string
  images: string[]
  specs: Record<string, string>
  category: {
    id: string
    slug: string
    name: string
  }
  createdAt: string
}

export interface ProductDetails extends Product {
  attributes: Record<string, string>
  related: Product[]
}

export interface Category {
  id: string
  slug: string
  name: string
  nameEn: string
  description: string
  image: string
  productsCount: number
  filters: CategoryFilter[]
}

export type FilterType = 'checkbox' | 'radio' | 'color' | 'range'

export type ProductSort = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'rating-desc' | 'popular' | 'title-asc'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface CategoryFilter {
  key: string
  label: string
  type: FilterType
  options?: FilterOption[]
  min?: number
  max?: number
  unit?: string
}

export interface ProductsResponse {
  items: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
  sort?: ProductSort
}

export interface ProductsQuery {
  category?: string
  q?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  onSale?: boolean
  sort?: ProductSort
  page?: number
  limit?: number
  [key: string]: string | number | boolean | undefined
}

