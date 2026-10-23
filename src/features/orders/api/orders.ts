import { api } from '../../../shared/api'
import type { Order } from '../types'

export async function getOrders(signal?: AbortSignal): Promise<{ items: Order[] }> {
  return api.get<{ items: Order[] }>('/orders', signal ? { signal } : undefined)
}

export async function getOrder(orderId: string, signal?: AbortSignal): Promise<{ order: Order }> {
  return api.get<{ order: Order }>(`/orders/${orderId}`, signal ? { signal } : undefined)
}

export async function cancelOrder(orderId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/orders/${orderId}/cancel`, {})
}

