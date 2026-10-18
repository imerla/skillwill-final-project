import { ApiErrorClass } from '../../shared/api/types'
import type { Translations } from '../../shared/i18n/LanguageContext'

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

export function getCartErrorMessage(error: unknown, t: Translations, ctx?: { stock?: number }): string {
  if (!(error instanceof ApiErrorClass)) {
    return t.common.networkError
  }

  const stock = getAvailableStock(error) ?? ctx?.stock ?? 0

  switch (error.code) {
    case 'INSUFFICIENT_STOCK':
      return stock > 0 ? t.cart.onlyN(stock) : t.cart.stockChanged
    case 'OUT_OF_STOCK':
      return t.cart.outOfStock
    case 'PRODUCT_NOT_FOUND':
      return t.cart.productGone
    case 'CART_ITEM_NOT_FOUND':
      return t.cart.itemGone
    default:
      if (error.status === 422) {
        return t.cart.qtyRange
      }
      return t.common.genericError
  }
}

