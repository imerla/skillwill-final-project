import { ApiErrorClass } from '../../shared/api/types'
import { ka } from '../../shared/i18n/ka'

export function getAvailableStock(error: unknown): number | undefined {
  if (error instanceof ApiErrorClass) {
    const body = error.body as { available?: number; details?: { available?: number } } | undefined
    if (typeof body?.available === 'number') {
      return body.available
    }
    if (typeof body?.details?.available === 'number') {
      return body.details.available
    }
  }
  return undefined
}

export function getCartErrorMessage(error: unknown, ctx?: { stock?: number }): string {
  if (!(error instanceof ApiErrorClass)) {
    return ka.common.networkError
  }

  const stock = getAvailableStock(error) ?? ctx?.stock ?? 0

  switch (error.code) {
    case 'INSUFFICIENT_STOCK':
      return stock > 0 ? ka.cart.onlyN(stock) : ka.cart.stockChanged
    case 'OUT_OF_STOCK':
      return ka.cart.outOfStock
    case 'PRODUCT_NOT_FOUND':
      return ka.cart.productGone
    case 'CART_ITEM_NOT_FOUND':
      return ka.cart.itemGone
    default:
      if (error.status === 422) {
        return ka.cart.qtyRange
      }
      return ka.common.genericError
  }
}

