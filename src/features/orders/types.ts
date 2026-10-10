export interface Shipping {
  fullName: string
  phone: string
  city: string
  address: string
}

export interface OrderItem {
  productId: string | null
  slug: string
  title: string
  image: string
  price: number
  qty: number
}

export type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'failed'

export interface Order {
  id: string
  status: OrderStatus
  items: OrderItem[]
  total: number
  currency: string
  shipping: Shipping
  createdAt: string
}

