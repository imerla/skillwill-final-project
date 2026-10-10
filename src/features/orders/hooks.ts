import { useQuery } from '@tanstack/react-query'
import { getOrders, getOrder } from './api/orders'
import type { Order } from './types'

const ORDERS_QUERY_KEY = ['orders']

export function useOrders(options?: { enabled?: boolean }) {
  return useQuery<{ items: Order[] }>({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: ({ signal }) => getOrders(signal),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  })
}

export function useOrder(orderId: string) {
  return useQuery<{ order: Order }>({
    queryKey: ORDERS_QUERY_KEY.concat(orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000,
  })
}

