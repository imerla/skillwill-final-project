import type { CartItem } from '../cart/types'
import type { Shipping, Order, OrderItem, OrderStatus } from '../orders/types'

export interface Card {
  number: string
  holder: string
  expiry: string
  cvc: string
}

export interface CreateOrderRequest {
  shipping: Shipping
  card: Card
}

export interface CreateOrderResponse {
  orderId: string
  status: string
  total: number
  currency: string
  message: string
  expiresInMinutes: number
  devCode?: string
}

export interface ConfirmOrderRequest {
  code: string
}

export interface ConfirmOrderResponse {
  order: Order
}

export interface ResendCodeResponse {
  message: string
  expiresInMinutes: number
  devCode?: string
}

export interface CheckoutSummary {
  items: CartItem[]
  totalQty: number
  subtotal: number
  shippingFee: number
  total: number
  currency: string
  freeShippingFrom: number
  shipping: Shipping
}

// Re-export for backward compatibility
export type { Shipping, Order, OrderItem, OrderStatus }

