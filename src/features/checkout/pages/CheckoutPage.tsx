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
import { ka } from '../../../shared/i18n/ka'
import { ROUTES } from '../../../app/routes'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import './CheckoutPage.css'

const shippingSchema = z.object({
  fullName: z.string().min(2, ka.validation.nameMin),
  phone: z.string().min(9, ka.validation.phoneMin),
  city: z.string().min(2, ka.validation.cityMin),
  address: z.string().min(5, ka.validation.addressMin),
})

const cardSchema = z.object({
  number: z.string()
    .regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, ka.validation.cardNumberInvalid)
    .transform((val) => val.replace(/\s/g, '')), // Remove spaces after validation
  holder: z.string().min(2, ka.validation.cardHolderMin),
  expiry: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, ka.validation.expiryInvalid)
    .refine((val) => {
      const [month, year] = val.split('/').map(Number)
      const now = new Date()
      const currentYear = now.getFullYear() % 100
      const currentMonth = now.getMonth() + 1
      if (year < currentYear) return false
      if (year === currentYear && month < currentMonth) return false
      return true
    }, ka.validation.expiryInvalid),
  cvc: z.string().regex(/^\d{3,4}$/, ka.validation.cvcInvalid),
})

const checkoutSchema = z.object({
  shipping: shippingSchema,
  card: cardSchema,
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, ka.validation.codeInvalid),
})

type CodeFormData = z.infer<typeof codeSchema>

interface DeliveryOption {
  id: string
  name: string
  description: string
  price: number
  estimatedDays: string
}

const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'pickup',
    name: 'მაღაზიიდან გატანა',
    description: '7 დღის განმავლობაში',
    price: 0,
    estimatedDays: 'მაშინვე',
  },
  {
    id: 'standard',
    name: 'სტანდარტული მიწოდება',
    description: '4-5 სამუშაო დღე',
    price: 5,
    estimatedDays: '4-5 დღე',
  },
  {
    id: 'express',
    name: 'სწრაფი მიწოდება',
    description: '1-3 სამუშაო დღე',
    price: 15,
    estimatedDays: '1-3 დღე',
  },
]

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
      return 'ტელეფონის ნომერი უნდა შეიცავდეს მინიმუმ 9 ციფრს'
    }
    return true
  }

  if (!show) return null

  return (
    <div className="checkout-page__address-modal">
      <div className="checkout-page__address-modal-content">
        <h3 className="checkout-page__modal-title">
          {editingAddress ? 'მისამართის რედაქტირება' : 'ახალი მისამართი'}
        </h3>
        <button
          className="checkout-page__modal-close"
          onClick={onClose}
        >
          ✕
        </button>
        <form onSubmit={handleSubmit(onSubmit)} className="checkout-page__address-form" noValidate onChange={handleFormChange}>
          <FormField label="სახელწოდება" error={errors.label?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder="მაგ: სახლი, ოფისი"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.label}
                disabled={isLoading}
                {...register('label', { required: 'სახელწოდება სავალდებულოა' })}
              />
            )}
          </FormField>

          <FormField label="სრული სახელი" error={errors.fullName?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder="სახელი და გვარი"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.fullName}
                disabled={isLoading}
                {...register('fullName', { required: 'სრული სახელი სავალდებულოა' })}
              />
            )}
          </FormField>

          <FormField label="ტელეფონი" error={errors.phone?.message}>
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
                  required: 'ტელეფონი სავალდებულოა',
                  onChange: (e) => {
                    e.target.value = formatPhone(e.target.value)
                  },
                  validate: validatePhone,
                })}
              />
            )}
          </FormField>

          <FormField label="ქალაქი" error={errors.city?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder="ქალაქი"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.city}
                disabled={isLoading}
                {...register('city', { required: 'ქალაქი სავალდებულოა' })}
              />
            )}
          </FormField>

          <FormField label="მისამართი" error={errors.address?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder="მისამართი"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.address}
                disabled={isLoading}
                {...register('address', { required: 'მისამართი სავალდებულოა' })}
              />
            )}
          </FormField>

          <div className="checkout-page__address-form-actions">
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
            >
              {editingAddress ? 'შენახება' : 'დამატება'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              გაუქმება
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CheckoutPage() {
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
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('standard')

  useDocumentTitle(ka.checkout.title)

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
          setActionError(err.message || 'მისამართის შენახვა ვერ მოხერხდა')
        }
      } else {
        setActionError('მისამართის შენახვა ვერ მოხერხდა')
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
      setSubmitError(getCheckoutErrorMessage(err))
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
      setSubmitError(getCheckoutErrorMessage(err))
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
      setSubmitError(getCheckoutErrorMessage(err))
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
        onError: (e) => setActionError(getCartErrorMessage(e)),
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
      onError: (e) => setActionError(getCartErrorMessage(e)),
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
          title={ka.cart.empty}
          actionLabel={ka.catalog.titleFallback}
          onAction={() => navigate(ROUTES.catalog)}
        />
      </PageContainer>
    )
  }

  if (step === 'form') {
    return (
      <PageContainer size="page" as="section">
        <h1 className="checkout-page__page-title">{ka.checkout.title}</h1>

        <div className="checkout-page__content">
          {actionError && <Alert variant="error" message={actionError} className="checkout-page__alert" />}

          <div className="checkout-page__left-column">
            <div className="checkout-page__summary">
            <h2 className="checkout-page__section-title">შეკვეთის პროდუქტები</h2>
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
                        />
                        <Button
                          variant="secondary"
                          onClick={() => handleRemove(item.id)}
                          disabled={isAnyMutationPending}
                          className="checkout-page__item-remove"
                        >
                          {ka.cart.remove}
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
                <span>{ka.cart.subtotal} ({checkout?.totalQty} ცალი)</span>
                <span>{formatPrice(checkout?.subtotal || 0, checkout?.currency)}</span>
              </div>
              <div className="checkout-page__total-row">
                <span>მიწოდების საფასური</span>
                <span>{formatPrice(DELIVERY_OPTIONS.find(opt => opt.id === selectedDeliveryId)?.price || 0, checkout?.currency)}</span>
              </div>
              <div className="checkout-page__total-row checkout-page__total-row--total">
                <span>{ka.checkout.total}</span>
                <span>{formatPrice((checkout?.total || 0) - (checkout?.shippingFee || 0) + (DELIVERY_OPTIONS.find(opt => opt.id === selectedDeliveryId)?.price || 0), checkout?.currency)}</span>
              </div>
            </div>
          </div>

          <div className="checkout-page__delivery-section">
            <h2 className="checkout-page__section-title">მიწოდება</h2>
            <div className="checkout-page__delivery-options">
              {DELIVERY_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`checkout-page__delivery-option ${selectedDeliveryId === option.id ? 'checkout-page__delivery-option--selected' : ''}`}
                  onClick={() => setSelectedDeliveryId(option.id)}
                >
                  <div className="checkout-page__delivery-option-radio">
                    <input
                      type="radio"
                      name="delivery"
                      id={`delivery-${option.id}`}
                      checked={selectedDeliveryId === option.id}
                      onChange={() => setSelectedDeliveryId(option.id)}
                    />
                    <label htmlFor={`delivery-${option.id}`}>
                      <span className="checkout-page__delivery-option-name">{option.name}</span>
                      <span className="checkout-page__delivery-option-description">{option.description}</span>
                      <span className="checkout-page__delivery-option-price">
                        {option.price === 0 ? 'უფასო' : formatPrice(option.price, checkout?.currency)}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>

          <div className="checkout-page__form-section">
            <h2 className="checkout-page__section-title">მიწოდების ინფორმაცია</h2>

            {/* Address Selector */}
            <div className="checkout-page__address-selector">
              <Button
                variant="secondary"
                onClick={() => setShowAddressSelector(!showAddressSelector)}
                className="checkout-page__address-selector-btn"
              >
                {showAddressSelector ? 'დახურვა' : 'მისამართის არჩევა'}
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
                            <span className="checkout-page__address-item-default">მთავარი</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="checkout-page__no-addresses">
                      <p>მისამართები არ არის დამატებული</p>
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
                    + ახალი მისამართი
                  </Button>
                </div>
              )}
            </div>

            <form onSubmit={form.handleSubmit(handleCheckoutSubmit)} className="checkout-page__form" noValidate>
              {!selectedAddressId && (
                <>
                  <FormField label={ka.checkout.fullName} error={form.formState.errors.shipping?.fullName?.message}>
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

                  <FormField label={ka.checkout.phone} error={form.formState.errors.shipping?.phone?.message}>
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

                  <FormField label={ka.checkout.city} error={form.formState.errors.shipping?.city?.message}>
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

                  <FormField label={ka.checkout.address} error={form.formState.errors.shipping?.address?.message}>
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
                  <span className="checkout-page__selected-address-label">მისამართი:</span>
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
                    შეცვლა
                  </Button>
                </div>
              )}

              <h2 className="checkout-page__section-title">{ka.checkout.paymentInfo}</h2>

              <FormField label={ka.checkout.cardNumber} error={form.formState.errors.card?.number?.message}>
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

              <FormField label={ka.checkout.cardHolder} error={form.formState.errors.card?.holder?.message}>
                {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                  <Input
                    id={id}
                    type="text"
                    autoComplete="cc-name"
                    placeholder="ბარათის მფლობელი"
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
                <FormField label={ka.checkout.expiry} error={form.formState.errors.card?.expiry?.message}>
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

                <FormField label={ka.checkout.cvc} error={form.formState.errors.card?.cvc?.message}>
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
                {createOrder.isPending ? ka.checkout.processing : ka.checkout.placeOrder}
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
        <h1 className="checkout-page__page-title">{ka.checkout.confirmTitle}</h1>
        <div className="checkout-page__confirm-section">
          <p className="checkout-page__confirm-message">{ka.checkout.confirmMessage}</p>
          <p className="checkout-page__confirm-total">
            {ka.checkout.total}: {formatPrice(createOrder.data?.total || 0, checkout?.currency)}
          </p>

          <form onSubmit={codeForm.handleSubmit(handleConfirmSubmit)} className="checkout-page__code-form" noValidate>
            <FormField label={ka.checkout.confirmCode} error={codeForm.formState.errors.code?.message}>
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
              <Alert variant="info" message={`${ka.checkout.devCode}: ${devCode}`} className="checkout-page__alert" />
            )}

            {submitError && (
              <Alert variant="error" message={submitError} className="checkout-page__alert" />
            )}

            <Button
              type="submit"
              loading={confirmOrder.isPending}
              disabled={confirmOrder.isPending}
            >
              {confirmOrder.isPending ? ka.checkout.confirming : ka.checkout.confirmOrder}
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={resendTimer !== null || resendCode.isPending}
              onClick={handleResendCode}
            >
              {resendTimer !== null
                ? ka.checkout.resendIn(resendTimer)
                : resendCode.isPending
                ? ka.checkout.sending
                : ka.checkout.resendCode}
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
        <h1 className="checkout-page__success-title">{ka.checkout.successTitle}</h1>
        <p className="checkout-page__success-message">{ka.checkout.successMessage}</p>
        {confirmedOrder && (
          <div className="checkout-page__success-details">
            <p className="checkout-page__success-order-id">
              {ka.checkout.orderId}: {confirmedOrder.id}
            </p>
            <p className="checkout-page__success-total">
              {ka.checkout.total}: {formatPrice(confirmedOrder.total, confirmedOrder.currency)}
            </p>
            <p className="checkout-page__success-status">
              {ka.checkout.status}: {confirmedOrder.status === 'paid' ? ka.orders.statusPaid : ka.orders.statusPending}
            </p>
          </div>
        )}
        <div className="checkout-page__success-actions">
          <Link to={ROUTES.orders}>
            <Button>{ka.checkout.viewOrders}</Button>
          </Link>
          <Link to={ROUTES.catalog}>
            <Button variant="secondary">{ka.checkout.continueShopping}</Button>
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

