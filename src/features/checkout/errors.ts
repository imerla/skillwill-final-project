import { ApiErrorClass } from '../../shared/api/types'
import { ka } from '../../shared/i18n/ka'

export function getCheckoutErrorMessage(error: unknown): string {
  if (!(error instanceof ApiErrorClass)) {
    return ka.common.networkError
  }

  switch (error.code) {
    case 'INSUFFICIENT_STOCK':
    case 'OUT_OF_STOCK':
      return ka.checkout.stockError
    case 'PRODUCT_NOT_FOUND':
      return ka.cart.productGone
    default:
      // TODO: Remove this backward-compatibility check once server always sends code
      if (!error.code && error.message && error.message.includes('NotEnoughStock')) {
        return ka.checkout.stockError
      }
      if (error.status === 422) {
        return error.message || ka.common.genericError
      }
      return ka.common.genericError
  }
}

