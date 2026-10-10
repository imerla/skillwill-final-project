import { api } from '../../../shared/api'
import type {
  CheckoutSummary,
  CreateOrderRequest,
  CreateOrderResponse,
  ConfirmOrderRequest,
  ConfirmOrderResponse,
  ResendCodeResponse
} from '../types'

export async function getCheckout(signal?: AbortSignal): Promise<CheckoutSummary> {
  return api.get<CheckoutSummary>('/checkout', signal ? { signal } : undefined)
}

export async function createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
  return api.post<CreateOrderResponse>('/orders', data)
}

export async function confirmOrder(orderId: string, data: ConfirmOrderRequest): Promise<ConfirmOrderResponse> {
  return api.post<ConfirmOrderResponse>(`/orders/${orderId}/confirm`, data)
}

export async function resendCode(orderId: string): Promise<ResendCodeResponse> {
  return api.post<ResendCodeResponse>(`/orders/${orderId}/resend-code`)
}

