import { ApiErrorClass } from '../../shared/api/types'
import type { Translations } from '../../shared/i18n/LanguageContext'

export function getCheckoutErrorMessage(error: unknown, t: Translations): string {
  if (!(error instanceof ApiErrorClass)) {
    return t.common.networkError
  }
  
  switch (error.code) {
    case 'INSUFFICIENT_STOCK':
    case 'OUT_OF_STOCK':
      return t.checkout.stockError
    case 'PRODUCT_NOT_FOUND':
      return t.cart.productGone
    default:
      if (!error.code && error.message && error.message.includes('NotEnoughStock')) {
        return t.checkout.stockError
      }
      if (error.status === 422) {
        return error.message || t.common.genericError
      }
      return t.common.genericError
  }
}

