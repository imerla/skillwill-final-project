import type { Product } from '../catalog/types'

export interface Favorite {
  productId: string
  product: Product
  addedAt: string
}

export interface Favorites {
  items: Favorite[]
  total: number
}
