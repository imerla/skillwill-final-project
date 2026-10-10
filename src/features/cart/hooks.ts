import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../shared/auth'
import { getCart, addToCart, updateCartItemQuantity, removeCartItem, clearCart } from './api/cart'
import type { AddToCartRequest, UpdateQuantityRequest } from './types'

const CART_QUERY_KEY = ['cart']

export function useCart() {
  const { isAuthenticated, isLoading: isSessionLoading } = useSession()

  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: ({ signal }) => getCart(signal),
    enabled: isAuthenticated && !isSessionLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddToCartRequest) => addToCart(data),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart)
    },
  })
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuantityRequest }) =>
      updateCartItemQuantity(id, data),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart)
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart)
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(CART_QUERY_KEY, updatedCart)
    },
  })
}

