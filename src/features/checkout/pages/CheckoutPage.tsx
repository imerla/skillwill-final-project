import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCheckout, useCreateOrder, useConfirmOrder, useResendCode } from '../hooks'
import { useUpdateCartItemQuantity, useRemoveCartItem } from '../../cart/hooks'
import { useAddresses, useCreateAddress, useUpdateAddress, type Address, type CreateAddressRequest } from '../../profile/hooks'
import { getCheckoutErrorMessage } from '../errors'
import { getCartErrorMessage } from '../../cart/errors'
import type { CreateOrderRequest, Order } from '../types'
import { ApiErrorClass, applyServerErrors } from '../../../shared/api'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { FormField } from '../../../shared/ui/FormField'
import { Input } from '../../../shared/ui/Input/Input'
import { Alert } from '../../../shared/ui/Alert/Alert'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { ErrorState } from '../../../shared/ui/ErrorState/ErrorState'
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState'
import { QuantityStepper } from '../../../shared/ui/QuantityStepper/QuantityStepper'
import { formatPrice } from '../../../shared/lib/format'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { ROUTES } from '../../../app/routes'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import './CheckoutPage.css'

const PENDING_ORDER_ID_STORAGE_KEY = 'pending_checkout_order_id'
const PENDING_ORDER_DETAILS_STORAGE_KEY = 'pending_checkout_order_details'

type CheckoutFormData = {
  shipping: {
    fullName: string
    phone: string
    city: string
    address: string
  }
  card: {
    number: string
    holder: string
    expiry: string
    cvc: string
  }
}

type CodeFormData = {
  code: string
}

function AddressFormModal({
  show,
  editingAddress,
  onClose,
  onSubmit,
  isLoading,
  serverError,
}: {
  show: boolean
  editingAddress: Address | null
  onClose: () => void
  onSubmit: (data: { label: string; fullName: string; phone: string; city: string; address: string }) => void
  isLoading: boolean
  serverError: ApiErrorClass | null
}) {
  const { t } = useLanguage()
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm<{ label: string; fullName: string; phone: string; city: string; address: string }>({
    defaultValues: editingAddress
      ? {
          label: editingAddress.label,
          fullName: editingAddress.fullName,
          phone: editingAddress.phone,
          city: editingAddress.city,
          address: editingAddress.address,
        }
      : {
          label: '',
          fullName: '',
          phone: '',
          city: '',
          address: '',
        },
  })

  // Apply server errors when they change
  useEffect(() => {
    if (serverError && serverError.status === 422) {
      applyServerErrors(serverError, setError, ['label', 'fullName', 'phone', 'city', 'address'])
    }
  }, [serverError, setError])

  // Reset form when editingAddress changes
  useEffect(() => {
    if (show && editingAddress) {
      // When editing, reset with address data
      const currentValues = {
        label: editingAddress.label,
        fullName: editingAddress.fullName,
        phone: editingAddress.phone,
        city: editingAddress.city,
        address: editingAddress.address,
      }
      // The form is already initialized with defaultValues, so we just need to update
      Object.entries(currentValues).forEach(([key, value]) => {
        setValue(key as keyof typeof currentValues, value)
      })
    } else if (show && !editingAddress) {
      // When adding new, reset to empty
      const emptyValues = {
        label: '',
        fullName: '',
        phone: '',
        city: '',
        address: '',
      }
      Object.entries(emptyValues).forEach(([key, value]) => {
        setValue(key as keyof typeof emptyValues, value)
      })
    }
  }, [show, editingAddress, setValue])

  const handleFormChange = () => {
    clearErrors()
  }

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 0) return ''
    if (cleaned.startsWith('995')) {
      const rest = cleaned.slice(3)
      if (rest.length <= 3) return `+995 ${rest}`
      if (rest.length <= 6) return `+995 ${rest.slice(0, 3)} ${rest.slice(3)}`
      if (rest.length <= 9) return `+995 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
      return `+995 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 9)}`
    }
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`
  }

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length < 9) {
      return t.checkout.addressForm.phoneMin
    }
    return true
  }

  if (!show) return null

  return (
    <div className="checkout-page__address-modal">
      <div className="checkout-page__address-modal-content">
        <h3 className="checkout-page__modal-title">
          {editingAddress ? t.checkout.addressForm.editTitle : t.checkout.addressForm.newTitle}
        </h3>
        <button
          className="checkout-page__modal-close"
          onClick={onClose}
        >
          ✕
        </button>
        <form onSubmit={handleSubmit(onSubmit)} className="checkout-page__address-form" noValidate onChange={handleFormChange}>
          <FormField label={t.checkout.addressForm.label} error={errors.label?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder={t.checkout.addressForm.labelPlaceholder}
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.label}
                disabled={isLoading}
                {...register('label', { required: t.checkout.addressForm.labelRequired })}
              />
            )}
          </FormField>

          <FormField label={t.checkout.addressForm.fullName} error={errors.fullName?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder={t.checkout.addressForm.fullNamePlaceholder}
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.fullName}
                disabled={isLoading}
                {...register('fullName', { required: t.checkout.addressForm.fullNameRequired })}
              />
            )}
          </FormField>

          <FormField label={t.checkout.addressForm.phone} error={errors.phone?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="tel"
                placeholder="+995 555 12 34 56"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.phone}
                disabled={isLoading}
                {...register('phone', {
                  required: t.checkout.addressForm.phoneRequired,
                  onChange: (e) => {
                    e.target.value = formatPhone(e.target.value)
                  },
                  validate: validatePhone,
                })}
              />
            )}
          </FormField>

          <FormField label={t.checkout.addressForm.city} error={errors.city?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder={t.checkout.addressForm.cityPlaceholder}
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.city}
                disabled={isLoading}
                {...register('city', { required: t.checkout.addressForm.cityRequired })}
              />
            )}
          </FormField>

          <FormField label={t.checkout.addressForm.address} error={errors.address?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder={t.checkout.addressForm.addressPlaceholder}
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.address}
                disabled={isLoading}
                {...register('address', { required: t.checkout.addressForm.addressRequired })}
              />
            )}
          </FormField>

          <div className="checkout-page__address-form-actions">
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
            >
              {editingAddress ? t.checkout.addressForm.save : t.checkout.addressForm.add}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              {t.checkout.addressForm.cancel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CheckoutPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: checkout, isLoading, error, refetch } = useCheckout()
  const { data: addresses } = useAddresses()
  const createOrder = useCreateOrder()
  const confirmOrder = useConfirmOrder()
  const resendCode = useResendCode()
  const updateQuantity = useUpdateCartItemQuantity()
  const removeItem = useRemoveCartItem()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()

  const [orderId, setOrderId] = useState<string | null>(
    () => sessionStorage.getItem(PENDING_ORDER_ID_STORAGE_KEY)
  )

  const [step, setStep] = useState<'form' | 'confirm' | 'success'>(() => {
    const savedOrderId = sessionStorage.getItem(PENDING_ORDER_ID_STORAGE_KEY)
    const savedDetails = sessionStorage.getItem(PENDING_ORDER_DETAILS_STORAGE_KEY)
    // Only go to confirm if both orderId and details are present
    if (savedOrderId && savedDetails) {
      return 'confirm'
    }
    // Clear incomplete storage and go to form
    sessionStorage.removeItem(PENDING_ORDER_ID_STORAGE_KEY)
    sessionStorage.removeItem(PENDING_ORDER_DETAILS_STORAGE_KEY)
    return 'form'
  })
  const [devCode, setDevCode] = useState<string | null>(() => {
    try {
      const savedDetails = sessionStorage.getItem(PENDING_ORDER_DETAILS_STORAGE_KEY)
      return savedDetails ? JSON.parse(savedDetails).devCode : null
    } catch {
      return null
    }
  })
  const [pendingOrderTotal, setPendingOrderTotal] = useState<number | null>(() => {
    try {
      const savedDetails = sessionStorage.getItem(PENDING_ORDER_DETAILS_STORAGE_KEY)
      return savedDetails ? JSON.parse(savedDetails).total : null
    } catch {
      return null
    }
  })
  const [pendingOrderCurrency, setPendingOrderCurrency] = useState<string | null>(() => {
    try {
      const savedDetails = sessionStorage.getItem(PENDING_ORDER_DETAILS_STORAGE_KEY)
      return savedDetails ? JSON.parse(savedDetails).currency : null
    } catch {
      return null
    }
  })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState<number | null>(null)
  const hasAutoResendAttemptedRef = useRef(false)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>({})
  const hasQuantityError = Object.keys(quantityErrors).some((key) => quantityErrors[key] !== '')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressSelector, setShowAddressSelector] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressServerError, setAddressServerError] = useState<ApiErrorClass | null>(null)

  useDocumentTitle(t.checkout.title)

  // Reset auto resend flag when step changes to form
  useEffect(() => {
    if (step === 'form') {
      hasAutoResendAttemptedRef.current = false
    }
  }, [step])

  const handleResendCode = useCallback(async () => {
    if (!orderId || resendTimer !== null) return
    setSubmitError(null) // Clear any previous error
    try {
      const result = await resendCode.mutateAsync(orderId)
      if (result.devCode) {
        setDevCode(result.devCode)
      }
      setResendTimer(30)
    } catch (err) {
      setSubmitError(getCheckoutErrorMessage(err, t))
    }
  }, [orderId, resendTimer, resendCode, t])

  // Auto-resend code when entering confirm step with pending order
  useEffect(() => {
    if (step === 'confirm' && orderId && !devCode && !hasAutoResendAttemptedRef.current) {
      hasAutoResendAttemptedRef.current = true
      setTimeout(() => {
        handleResendCode()
      }, 100)
    }
  }, [step, orderId, devCode, handleResendCode])

  // Define schemas with dynamic translations
  const shippingSchema = z.object({
    fullName: z.string().min(2, t.validation.nameMin),
    phone: z.string().min(9, t.validation.phoneMin),
    city: z.string().min(2, t.validation.cityMin),
    address: z.string().min(5, t.validation.addressMin),
  })

  const cardSchema = z.object({
    number: z.string()
      .regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, t.validation.cardNumberInvalid)
      .transform((val) => val.replace(/\s/g, '')), // Remove spaces after validation
    holder: z.string().min(2, t.validation.cardHolderMin),
    expiry: z.string()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, t.validation.expiryInvalid)
      .refine((val) => {
        const [month, year] = val.split('/').map(Number)
        const now = new Date()
        const currentYear = now.getFullYear() % 100
        const currentMonth = now.getMonth() + 1
        if (year < currentYear) return false
        if (year === currentYear && month < currentMonth) return false
        return true
      }, t.checkout.cardExpiryExpired),
    cvc: z.string().regex(/^\d{3,4}$/, t.validation.cvcInvalid),
  })

  const checkoutSchema = z.object({
    shipping: shippingSchema,
    card: cardSchema,
  })

  const codeSchema = z.object({
    code: z.string().regex(/^\d{6}$/, t.validation.codeInvalid),
  })

  const isAnyMutationPending = updateQuantity.isPending || removeItem.isPending || createAddress.isPending || updateAddress.isPending

  // Card number formatting
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const maxLength = 16
    const trimmed = cleaned.slice(0, maxLength)
    const groups = trimmed.match(/.{1,4}/g)
    const formatted = groups ? groups.join(' ') : ''
    return formatted
  }

  // Card expiry formatting
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
    }
    return cleaned
  }

  // CVC formatting (max 4 digits)
  const formatCVC = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    return cleaned.slice(0, 4)
  }

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    reValidateMode: 'onSubmit',
    defaultValues: {
      shipping: {
        fullName: '',
        phone: '',
        city: '',
        address: '',
      },
      card: {
        number: '',
        holder: '',
        expiry: '',
        cvc: '',
      },
    },
    resetOptions: { keepDirtyValues: true },
  })

  // Clear main form errors when address modal opens
  useEffect(() => {
    if (showAddressForm) {
      form.clearErrors()
    }
  }, [showAddressForm, form])

  // Auto-select default address if available and populate form
  const processedDefaultAddressRef = useRef(false)
  const autoSelectDefaultAddress = useCallback(() => {
    if (addresses?.items && addresses.items.length > 0 && !selectedAddressId && !processedDefaultAddressRef.current) {
      const defaultAddress = addresses.items.find((a: Address) => a.isDefault)
      if (defaultAddress) {
        processedDefaultAddressRef.current = true
        setSelectedAddressId((prev) => prev || defaultAddress.id)
        // Populate form with default address
        form.setValue('shipping.fullName', defaultAddress.fullName)
        form.setValue('shipping.phone', defaultAddress.phone)
        form.setValue('shipping.city', defaultAddress.city)
        form.setValue('shipping.address', defaultAddress.address)
      }
    }
  }, [addresses, selectedAddressId, form])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    autoSelectDefaultAddress()
  }, [autoSelectDefaultAddress])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Populate form from checkout.shipping if no addresses are saved
  useEffect(() => {
    if (!addresses?.items || addresses.items.length === 0) {
      if (checkout?.shipping) {
        form.setValue('shipping.fullName', checkout.shipping.fullName || '')
        form.setValue('shipping.phone', checkout.shipping.phone || '')
        form.setValue('shipping.city', checkout.shipping.city || '')
        form.setValue('shipping.address', checkout.shipping.address || '')
      }
    }
  }, [checkout, addresses, form])

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { code: '' },
  })

  const handleAddressSelect = (addressId: string) => {
    const address = addresses?.items?.find((a: Address) => a.id === addressId)
    if (address) {
      setSelectedAddressId(addressId)
      setShowAddressSelector(false)
      // Populate form with selected address
      form.setValue('shipping.fullName', address.fullName)
      form.setValue('shipping.phone', address.phone)
      form.setValue('shipping.city', address.city)
      form.setValue('shipping.address', address.address)
    }
  }

  const handleNewAddress = () => {
    setEditingAddress(null)
    setShowAddressForm(true)
  }

  const handleCloseAddressForm = () => {
    setShowAddressForm(false)
    setEditingAddress(null)
    setAddressServerError(null)
  }

  const handleAddressFormSubmit = async (data: { label: string; fullName: string; phone: string; city: string; address: string }) => {
    setAddressServerError(null)
    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({ id: editingAddress.id, data })
      } else {
        await createAddress.mutateAsync(data as CreateAddressRequest)
      }
      handleCloseAddressForm()
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.status === 422) {
          setAddressServerError(err)
        } else {
          setActionError(err.message || t.checkout.addressForm.saveError)
        }
      } else {
        setActionError(t.checkout.addressForm.saveError)
      }
    }
  }

  const handleCheckoutSubmit = async (data: CheckoutFormData) => {
    setSubmitError(null)

    // Check if address is selected
    if (!selectedAddressId) {
      setSubmitError(t.checkout.delivery.addressRequired)
      return
    }

    try {
      // Clean the data before sending - remove spaces from card number
      const cleanedData = {
        ...data,
        card: {
          ...data.card,
          number: data.card.number.replace(/\s/g, ''), // Remove spaces from card number
        },
      }
      const result = await createOrder.mutateAsync(cleanedData as CreateOrderRequest)

      sessionStorage.setItem(PENDING_ORDER_ID_STORAGE_KEY, result.orderId)
      sessionStorage.setItem(PENDING_ORDER_DETAILS_STORAGE_KEY, JSON.stringify({
        total: result.total - (checkout?.shippingFee || 0),
        currency: result.currency,
        expiresInMinutes: result.expiresInMinutes,
        devCode: result.devCode
      }))
      setOrderId(result.orderId)
      setPendingOrderTotal(result.total - (checkout?.shippingFee || 0))
      setPendingOrderCurrency(result.currency)
      if (result.devCode) {
        setDevCode(result.devCode)
      }
      hasAutoResendAttemptedRef.current = false
      setStep('confirm')
      setResendTimer(30) // Start timer immediately when entering confirm step
      form.setValue('card.number', '')
      form.setValue('card.holder', '')
      form.setValue('card.expiry', '')
      form.setValue('card.cvc', '')
    } catch (err) {
      if (err instanceof ApiErrorClass && err.status === 422 && err.errors) {
        // Map server errors to form fields
        Object.entries(err.errors).forEach(([key, value]) => {
          const message = Array.isArray(value) ? value[0] : value
          form.setError(key as keyof CheckoutFormData, { type: 'server', message })
        })
      }
      setSubmitError(getCheckoutErrorMessage(err, t))
    }
  }

  const handleConfirmSubmit = async (data: CodeFormData) => {
    if (!orderId) return
    setSubmitError(null)
    try {
      const result = await confirmOrder.mutateAsync({ orderId, data })

      sessionStorage.removeItem(PENDING_ORDER_ID_STORAGE_KEY)
      sessionStorage.removeItem(PENDING_ORDER_DETAILS_STORAGE_KEY)

      setOrderId(null)
      setPendingOrderTotal(null)
      setPendingOrderCurrency(null)
      setDevCode(null)
      hasAutoResendAttemptedRef.current = false
      setConfirmedOrder(result.order)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['checkout'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      setStep('success')
    } catch (err) {
      setSubmitError(getCheckoutErrorMessage(err, t))
    }
  }

  // Handle resend code timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (resendTimer !== null && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev === null || prev <= 1) {
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [resendTimer])

  const handleQuantityChange = (itemId: string, qty: number) => {
    setActionError(null)
    setQuantityErrors((prev) => ({ ...prev, [itemId]: '' }))
    // Find the item to check stock
    const item = checkout?.items.find((i) => i.id === itemId)
    const maxStock = item?.product.stock ?? 99
    // Don't auto-cap - reject if quantity exceeds stock
    if (qty > maxStock) {
      setQuantityErrors((prev) => ({
        ...prev,
        [itemId]: `${t.cart.stockChanged} ${t.cart.onlyN(maxStock)}`
      }))
      // Don't call mutation if quantity exceeds stock
      // The parent component (QuantityStepper) will reset the input to current value
      return
    }
    updateQuantity.mutate(
      { id: itemId, data: { qty } },
      {
        onSuccess: () => {
          setActionError(null)
          setQuantityErrors((prev) => ({ ...prev, [itemId]: '' }))
          refetch()
        },
        onError: (e) => {
          setActionError(getCartErrorMessage(e, t))
          setQuantityErrors((prev) => ({
            ...prev,
            [itemId]: getCartErrorMessage(e, t)
          }))
        },
      }
    )
  }

  const handleRemove = (itemId: string) => {
    setActionError(null)
    removeItem.mutate(itemId, {
      onSuccess: () => {
        setActionError(null)
        refetch()
      },
      onError: (e) => setActionError(getCartErrorMessage(e, t)),
    })
  }

  if (isLoading) {
    return (
      <PageContainer size="page" as="section">
        <div className="checkout-page__loading">
          <Skeleton style={{ height: '200px' }} />
          <Skeleton style={{ height: '200px' }} />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer size="page" as="section">
        <ErrorState onAction={() => refetch()} />
      </PageContainer>
    )
  }

  // Cart empty check only applies to form step
  if (step === 'form' && (!checkout || checkout.items.length === 0)) {
    return (
      <PageContainer size="page" as="section">
        <EmptyState
          title={t.cart.empty}
          actionLabel={t.catalog.titleFallback}
          onAction={() => navigate(ROUTES.catalog)}
        />
      </PageContainer>
    )
  }

  if (step === 'form') {
    return (
      <PageContainer size="page" as="section">
        <h1 className="checkout-page__page-title">{t.checkout.title}</h1>

        <div className="checkout-page__content">
          {actionError && <Alert variant="error" message={actionError} className="checkout-page__alert" />}

          <div className="checkout-page__left-column">
            <div className="checkout-page__summary">
            <h2 className="checkout-page__section-title">{t.checkout.orderProducts}</h2>
            <div className="checkout-page__items">
              {checkout?.items.map((item) => {
                const maxQty = Math.min(item.product.stock, 99)
                return (
                  <div key={item.id} className="checkout-page__item">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="checkout-page__item-image"
                      loading="lazy"
                    />
                    <div className="checkout-page__item-details">
                      <h3 className="checkout-page__item-title">{item.product.title}</h3>
                      <p className="checkout-page__item-brand">{item.product.brand}</p>
                      <div className="checkout-page__item-controls">
                        <QuantityStepper
                          value={item.qty}
                          onChange={(qty) => handleQuantityChange(item.id, qty)}
                          min={1}
                          max={maxQty}
                          disabled={isAnyMutationPending || !item.product.inStock}
                          t={t}
                        />
                        {quantityErrors[item.id] && (
                          <Alert variant="error" message={quantityErrors[item.id]} className="checkout-page__quantity-error" />
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => handleRemove(item.id)}
                          disabled={isAnyMutationPending}
                          className="checkout-page__item-remove"
                        >
                          {t.cart.remove}
                        </Button>
                      </div>
                    </div>
                    <p className="checkout-page__item-total">
                      {formatPrice(item.lineTotal, checkout?.currency)}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="checkout-page__totals">
              <div className="checkout-page__total-row">
                <span>{t.cart.subtotal} ({t.common.items(checkout?.totalQty || 0)})</span>
                <span>{formatPrice(checkout?.subtotal || 0, checkout?.currency)}</span>
              </div>
              <div className="checkout-page__total-row">
                <span>{t.checkout.shippingFee}</span>
                <span>{formatPrice(0, checkout?.currency)}</span>
              </div>
              <div className="checkout-page__total-row checkout-page__total-row--total">
                <span>{t.checkout.total}</span>
                <span>{formatPrice((checkout?.total || 0) - (checkout?.shippingFee || 0), checkout?.currency)}</span>
              </div>
            </div>
          </div>

          <div className="checkout-page__delivery-section">
            <h2 className="checkout-page__section-title">{t.checkout.delivery.title}</h2>
            <div className="checkout-page__delivery-info">
              <p className="checkout-page__delivery-name">{t.checkout.delivery.fastDelivery}</p>
              <p className="checkout-page__delivery-description">{t.checkout.delivery.fastDeliveryDesc}</p>
              <p className="checkout-page__delivery-price">{t.checkout.delivery.free}</p>
            </div>
          </div>
          </div>

          <div className="checkout-page__form-section">
            <h2 className="checkout-page__section-title">{t.checkout.delivery.info}</h2>

            {/* Address Selector */}
            <div className="checkout-page__address-selector">
              <Button
                variant="secondary"
                onClick={() => setShowAddressSelector(!showAddressSelector)}
                className="checkout-page__address-selector-btn"
              >
                {showAddressSelector ? t.checkout.delivery.close : t.checkout.delivery.selectAddress}
              </Button>

              {showAddressSelector && (
                <div className="checkout-page__address-list">
                  {addresses?.items && addresses.items.length > 0 ? (
                    addresses.items.map((address: Address) => (
                      <div
                        key={address.id}
                        className={`checkout-page__address-item ${selectedAddressId === address.id ? 'checkout-page__address-item--selected' : ''}`}
                        onClick={() => handleAddressSelect(address.id)}
                      >
                        <div className="checkout-page__address-item-info">
                          <div className="checkout-page__address-item-name">{address.fullName}</div>
                          <div className="checkout-page__address-item-phone">{address.phone}</div>
                          <div className="checkout-page__address-item-location">{address.city}, {address.address}</div>
                          {address.isDefault && (
                            <span className="checkout-page__address-item-default">{t.checkout.defaultAddress}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="checkout-page__no-addresses">
                      <p>{t.checkout.delivery.noAddresses}</p>
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleNewAddress()
                    }}
                    disabled={isAnyMutationPending}
                    className="checkout-page__address-new"
                  >
                    {t.checkout.delivery.newAddress}
                  </Button>
                </div>
              )}
            </div>

            {/* eslint-disable-next-line react-hooks/refs */}
            <form onSubmit={form.handleSubmit(handleCheckoutSubmit)} className="checkout-page__form" noValidate>
              {selectedAddressId && (
                <div className="checkout-page__selected-address-info">
                  <span className="checkout-page__selected-address-label">{t.checkout.delivery.addressLabel}</span>
                  <span className="checkout-page__selected-address-value">
                    {addresses?.items?.find((a: Address) => a.id === selectedAddressId)?.fullName}, {addresses?.items?.find((a: Address) => a.id === selectedAddressId)?.phone}, {addresses?.items?.find((a: Address) => a.id === selectedAddressId)?.city}, {addresses?.items?.find((a: Address) => a.id === selectedAddressId)?.address}
                  </span>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const address = addresses?.items?.find((a: Address) => a.id === selectedAddressId)
                      if (address) {
                        setEditingAddress(address)
                        setShowAddressForm(true)
                      }
                    }}
                    className="checkout-page__edit-address"
                  >
                    {t.profile.editAddress}
                  </Button>
                </div>
              )}

              <h2 className="checkout-page__section-title">{t.checkout.paymentInfo}</h2>

              <FormField label={t.checkout.cardNumber} error={form.formState.errors.card?.number?.message}>
                {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                  <Input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    aria-describedby={ariaDescribedby}
                    aria-invalid={ariaInvalid}
                    error={!!form.formState.errors.card?.number}
                    disabled={createOrder.isPending}
                    {...form.register('card.number', {
                      onChange: (e) => {
                        e.target.value = formatCardNumber(e.target.value)
                      },
                    })}
                  />
                )}
              </FormField>

              <FormField label={t.checkout.cardHolder} error={form.formState.errors.card?.holder?.message}>
                {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                  <Input
                    id={id}
                    type="text"
                    autoComplete="cc-name"
                    placeholder={t.checkout.cardHolderPlaceholder}
                    aria-describedby={ariaDescribedby}
                    aria-invalid={ariaInvalid}
                    error={!!form.formState.errors.card?.holder}
                    disabled={createOrder.isPending}
                    {...form.register('card.holder', {
                      onChange: (e) => {
                        e.target.value = e.target.value.toUpperCase()
                      },
                    })}
                  />
                )}
              </FormField>

              <div className="checkout-page__form-row">
                <FormField label={t.checkout.expiry} error={form.formState.errors.card?.expiry?.message}>
                  {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                    <Input
                      id={id}
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="12/29"
                      aria-describedby={ariaDescribedby}
                      aria-invalid={ariaInvalid}
                      error={!!form.formState.errors.card?.expiry}
                      disabled={createOrder.isPending}
                      {...form.register('card.expiry', {
                      onChange: (e) => {
                        e.target.value = formatExpiry(e.target.value)
                      },
                    })}
                  />
                )}
                </FormField>

                <FormField label={t.checkout.cvc} error={form.formState.errors.card?.cvc?.message}>
                  {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                    <Input
                      id={id}
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      aria-describedby={ariaDescribedby}
                      aria-invalid={ariaInvalid}
                      error={!!form.formState.errors.card?.cvc}
                      disabled={createOrder.isPending}
                      {...form.register('card.cvc', {
                      onChange: (e) => {
                        e.target.value = formatCVC(e.target.value)
                      },
                    })}
                  />
                )}
                </FormField>
              </div>

              {submitError && (
                <Alert variant="error" message={submitError} className="checkout-page__alert" />
              )}

              <Button
                type="submit"
                loading={createOrder.isPending}
                disabled={createOrder.isPending || hasQuantityError}
              >
                {createOrder.isPending ? t.checkout.processing : t.checkout.placeOrder}
              </Button>
            </form>
          </div>
        </div>

        <AddressFormModal
          show={showAddressForm}
          editingAddress={editingAddress}
          onClose={handleCloseAddressForm}
          onSubmit={handleAddressFormSubmit}
          isLoading={createAddress.isPending || updateAddress.isPending}
          serverError={addressServerError}
        />
      </PageContainer>
    )
  }

  if (step === 'confirm') {
    return (
      <PageContainer size="page" as="section">
        <h1 className="checkout-page__page-title">{t.checkout.confirmTitle}</h1>
        <div className="checkout-page__confirm-section">
          <p className="checkout-page__confirm-message">{t.checkout.confirmMessage}</p>
          <p className="checkout-page__confirm-total">
            {t.checkout.total}: {formatPrice(pendingOrderTotal ?? 0, pendingOrderCurrency ?? checkout?.currency)}
          </p>

          {/* eslint-disable-next-line react-hooks/refs */}
          <form onSubmit={codeForm.handleSubmit(handleConfirmSubmit)} className="checkout-page__code-form" noValidate>
            <FormField label={t.checkout.confirmCode} error={codeForm.formState.errors.code?.message}>
              {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                <Input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  className="checkout-page__input--code"
                  aria-describedby={ariaDescribedby}
                  aria-invalid={ariaInvalid}
                  error={!!codeForm.formState.errors.code}
                  disabled={confirmOrder.isPending}
                  {...codeForm.register('code')}
                />
              )}
            </FormField>

            {devCode && (
              <Alert variant="info" message={`${t.checkout.devCode}: ${devCode}`} className="checkout-page__alert" />
            )}

            {submitError && (
              <Alert variant="error" message={submitError} className="checkout-page__alert" />
            )}

            <Button
              type="submit"
              loading={confirmOrder.isPending}
              disabled={confirmOrder.isPending}
            >
              {confirmOrder.isPending ? t.checkout.confirming : t.checkout.confirmOrder}
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={resendTimer !== null || resendCode.isPending}
              onClick={handleResendCode}
            >
              {resendTimer !== null
                ? t.checkout.resendIn(resendTimer)
                : resendCode.isPending
                ? t.checkout.sending
                : t.checkout.resendCode}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                sessionStorage.removeItem(PENDING_ORDER_ID_STORAGE_KEY)
                sessionStorage.removeItem(PENDING_ORDER_DETAILS_STORAGE_KEY)
                setOrderId(null)
                setPendingOrderTotal(null)
                setPendingOrderCurrency(null)
                setDevCode(null)
                hasAutoResendAttemptedRef.current = false
                setStep('form')
              }}
            >
              {t.common.cancel}
            </Button>
          </form>
        </div>

        <AddressFormModal
          show={showAddressForm}
          editingAddress={editingAddress}
          onClose={handleCloseAddressForm}
          onSubmit={handleAddressFormSubmit}
          isLoading={createAddress.isPending || updateAddress.isPending}
          serverError={addressServerError}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="page" as="section">
      <div className="checkout-page__success">
        <h1 className="checkout-page__success-title">{t.checkout.successTitle}</h1>
        <p className="checkout-page__success-message">{t.checkout.successMessage}</p>
        {confirmedOrder && (
          <div className="checkout-page__success-details">
            <p className="checkout-page__success-order-id">
              {t.checkout.orderId}: {confirmedOrder.id}
            </p>
            <p className="checkout-page__success-total">
              {t.checkout.total}: {formatPrice(
                confirmedOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0),
                confirmedOrder.currency
              )}
            </p>
            <p className="checkout-page__success-status">
              {t.checkout.status}: {confirmedOrder.status === 'paid' ? t.orders.statusPaid : t.orders.statusPending}
            </p>
          </div>
        )}
        <div className="checkout-page__success-actions">
          <Link to={ROUTES.orders}>
            <Button>{t.checkout.viewOrders}</Button>
          </Link>
          <Link to={ROUTES.catalog}>
            <Button variant="secondary">{t.checkout.continueShopping}</Button>
          </Link>
        </div>

        <AddressFormModal
          show={showAddressForm}
          editingAddress={editingAddress}
          onClose={handleCloseAddressForm}
          onSubmit={handleAddressFormSubmit}
          isLoading={createAddress.isPending || updateAddress.isPending}
          serverError={addressServerError}
        />
      </div>
    </PageContainer>
  )
}

