export interface Cart {
  items: CartItem[]
  totalQty: number
  subtotal: number
  currency: string
}

export interface CartItem {
  id: string
  productId: string
  qty: number
  lineTotal: number
  product: CartItemProduct
}

export interface CartItemProduct {
  id: string
  slug: string
  title: string
  brand: string
  image: string
  price: number
  oldPrice: number | null
  currency: string
  stock: number
  inStock: boolean
}

export interface AddToCartRequest {
  productId: string
  qty?: number
}

export interface UpdateQuantityRequest {
  qty: number
}

