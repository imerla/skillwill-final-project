import { useState, useEffect, useMemo } from 'react'
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

  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState<number | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressSelector, setShowAddressSelector] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressServerError, setAddressServerError] = useState<ApiErrorClass | null>(null)

  useDocumentTitle(t.checkout.title)

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

  // Prepare shipping data from either backend or selected address
  const currentShippingValues = useMemo(() => {
    if (selectedAddressId && addresses?.items) {
      const addr = addresses.items.find((a: Address) => a.id === selectedAddressId)
      if (addr) {
        return {
          fullName: addr.fullName,
          phone: addr.phone,
          city: addr.city,
          address: addr.address,
        }
      }
    }
    return {
      fullName: checkout?.shipping?.fullName || '',
      phone: checkout?.shipping?.phone || '',
      city: checkout?.shipping?.city || '',
      address: checkout?.shipping?.address || '',
    }
  }, [checkout, selectedAddressId, addresses])

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
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
    values: {
      shipping: currentShippingValues,
      card: {
        number: '',
        holder: '',
        expiry: '',
        cvc: '',
      },
    },
    resetOptions: { keepDirtyValues: true },
  })

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { code: '' },
  })

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
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
      setOrderId(result.orderId)
      if (result.devCode) {
        setDevCode(result.devCode)
      }
      setStep('confirm')
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
      setConfirmedOrder(result.order)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['checkout'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      setStep('success')
    } catch (err) {
      setSubmitError(getCheckoutErrorMessage(err, t))
    }
  }

  const handleResendCode = async () => {
    if (!orderId || resendTimer !== null) return
    try {
      const result = await resendCode.mutateAsync(orderId)
      if (result.devCode) {
        setDevCode(result.devCode)
      }
      setResendTimer(30)
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
    updateQuantity.mutate(
      { id: itemId, data: { qty } },
      {
        onSuccess: () => {
          setActionError(null)
          refetch()
        },
        onError: (e) => setActionError(getCartErrorMessage(e, t)),
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

            <form onSubmit={form.handleSubmit(handleCheckoutSubmit)} className="checkout-page__form" noValidate>
              {!selectedAddressId && (
                <>
                  <FormField label={t.checkout.fullName} error={form.formState.errors.shipping?.fullName?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <Input
                        id={id}
                        type="text"
                        autoComplete="name"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!form.formState.errors.shipping?.fullName}
                        disabled={createOrder.isPending}
                        {...form.register('shipping.fullName')}
                      />
                    )}
                  </FormField>

                  <FormField label={t.checkout.phone} error={form.formState.errors.shipping?.phone?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <Input
                        id={id}
                        type="tel"
                        autoComplete="tel"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!form.formState.errors.shipping?.phone}
                        disabled={createOrder.isPending}
                        {...form.register('shipping.phone')}
                      />
                    )}
                  </FormField>

                  <FormField label={t.checkout.city} error={form.formState.errors.shipping?.city?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <Input
                        id={id}
                        type="text"
                        autoComplete="address-level2"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!form.formState.errors.shipping?.city}
                        disabled={createOrder.isPending}
                        {...form.register('shipping.city')}
                      />
                    )}
                  </FormField>

                  <FormField label={t.checkout.address} error={form.formState.errors.shipping?.address?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <Input
                        id={id}
                        type="text"
                        autoComplete="street-address"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!form.formState.errors.shipping?.address}
                        disabled={createOrder.isPending}
                        {...form.register('shipping.address')}
                      />
                    )}
                  </FormField>
                </>
              )}

              {selectedAddressId && (
                <div className="checkout-page__selected-address-info">
                  <span className="checkout-page__selected-address-label">{t.checkout.delivery.addressLabel}</span>
                  <span className="checkout-page__selected-address-value">
                    {addresses?.items?.find((a: Address) => a.id === selectedAddressId)?.fullName}, {addresses?.items?.find((a: Address) => a.id === selectedAddressId)?.phone}, {addresses?.items?.find((a: Address) => a.id === selectedAddressId)?.city}, {addresses?.items?.find((a: Address) => a.id === selectedAddressId)?.address}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedAddressId(null)
                    }}
                    className="checkout-page__change-address"
                  >
                    {t.checkout.delivery.change}
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
                disabled={createOrder.isPending}
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
            {t.checkout.total}: {formatPrice((createOrder.data?.total || 0) - (checkout?.shippingFee || 0), checkout?.currency)}
          </p>

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

            {import.meta.env.DEV && devCode && (
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

