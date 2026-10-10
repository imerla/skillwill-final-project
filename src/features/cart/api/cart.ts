import { api } from '../../../shared/api'
import type { Cart, AddToCartRequest, UpdateQuantityRequest } from '../types'

export async function getCart(signal?: AbortSignal): Promise<Cart> {
  return api.get<Cart>('/cart', signal ? { signal } : undefined)
}

export async function addToCart(data: AddToCartRequest): Promise<Cart> {
  return api.post<Cart>('/cart/items', data)
}

export async function updateCartItemQuantity(id: string, data: UpdateQuantityRequest): Promise<Cart> {
  return api.patch<Cart>(`/cart/items/${id}`, data)
}

export async function removeCartItem(id: string): Promise<Cart> {
  return api.delete<Cart>(`/cart/items/${id}`)
}

export async function clearCart(): Promise<Cart> {
  return api.delete<Cart>('/cart')
}

