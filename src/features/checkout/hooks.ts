import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCheckout, createOrder, confirmOrder, resendCode } from './api/checkout'
import type {
  CheckoutSummary,
  CreateOrderRequest,
  ConfirmOrderRequest,
  CreateOrderResponse,
  ConfirmOrderResponse,
  ResendCodeResponse
} from './types'

const CHECKOUT_QUERY_KEY = ['checkout']

export function useCheckout() {
  return useQuery<CheckoutSummary>({
    queryKey: CHECKOUT_QUERY_KEY,
    queryFn: ({ signal }) => getCheckout(signal),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation<CreateOrderResponse, Error, CreateOrderRequest>({
    mutationFn: (data) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export function useConfirmOrder() {
  return useMutation<ConfirmOrderResponse, Error, { orderId: string; data: ConfirmOrderRequest }>({
    mutationFn: ({ orderId, data }) => confirmOrder(orderId, data),
  })
}

export function useResendCode() {
  return useMutation<ResendCodeResponse, Error, string>({
    mutationFn: (orderId) => resendCode(orderId),
  })
}

