import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCheckout, useCreateOrder, useConfirmOrder, useResendCode } from '../hooks'
import { useUpdateCartItemQuantity, useRemoveCartItem } from '../../cart/hooks'
import { useAddresses, useCreateAddress, useUpdateAddress, type Address, type CreateAddressRequest } from '../../profile/hooks'
import { getCheckoutErrorMessage } from '../errors'
import { getCartErrorMessage } from '../../cart/errors'
import type { CreateOrderRequest, Order } from '../types'
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

const addressFormSchema = z.object({
  label: z.string().min(1, 'ლეიბლი აუცილებელია'),
  fullName: z.string().min(2, ka.validation.nameMin),
  phone: z.string().min(9, ka.validation.phoneMin),
  city: z.string().min(2, ka.validation.cityMin),
  address: z.string().min(5, ka.validation.addressMin),
})

const cardSchema = z.object({
  number: z.string().regex(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, ka.validation.cardNumberInvalid),
  holder: z.string().min(2, ka.validation.cardHolderMin),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, ka.validation.expiryInvalid),
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

function AddressFormModal({
  show,
  editingAddress,
  onClose,
  onSubmit,
  form,
  isPending,
}: {
  show: boolean
  editingAddress: Address | null
  onClose: () => void
  onSubmit: (data: z.infer<typeof addressFormSchema>) => void
  form: ReturnType<typeof useForm<z.infer<typeof addressFormSchema>>>
  isPending: boolean
}) {
  if (!show) return null

  return (
    <div className="checkout-page__address-modal">
      <div className="checkout-page__address-modal-content">
        <h3 className="checkout-page__modal-title">
          {editingAddress ? 'მისამართის რედაქტირება' : 'ახალი მისამართი'}
        </h3>
        <Button
          variant="secondary"
          onClick={onClose}
          className="checkout-page__modal-close"
        >
          დახურვა
        </Button>
        <form onSubmit={form.handleSubmit(onSubmit)} className="checkout-page__address-form" noValidate>
          <FormField label="ლეიბლი" error={form.formState.errors.label?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                autoComplete="organization"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!form.formState.errors.label}
                disabled={isPending}
                {...form.register('label')}
              />
            )}
          </FormField>

          <FormField label={ka.checkout.fullName} error={form.formState.errors.fullName?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                autoComplete="name"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!form.formState.errors.fullName}
                disabled={isPending}
                {...form.register('fullName')}
              />
            )}
          </FormField>

          <FormField label={ka.checkout.phone} error={form.formState.errors.phone?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="tel"
                autoComplete="tel"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!form.formState.errors.phone}
                disabled={isPending}
                {...form.register('phone')}
              />
            )}
          </FormField>

          <FormField label={ka.checkout.city} error={form.formState.errors.city?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                autoComplete="address-level2"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!form.formState.errors.city}
                disabled={isPending}
                {...form.register('city')}
              />
            )}
          </FormField>

          <FormField label={ka.checkout.address} error={form.formState.errors.address?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                autoComplete="street-address"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!form.formState.errors.address}
                disabled={isPending}
                {...form.register('address')}
              />
            )}
          </FormField>

          <Button
            type="submit"
            loading={isPending}
            disabled={isPending}
          >
            {isPending ? 'ინახება...' : 'შენახვა'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const itemsParam = searchParams.get('items')
  const selectedItemIds = itemsParam ? itemsParam.split(',').filter(Boolean) : undefined

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

  const addressForm = useForm<z.infer<typeof addressFormSchema>>({
    resolver: zodResolver(addressFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      label: '',
      fullName: '',
      phone: '',
      city: '',
      address: '',
    },
    values: editingAddress ? {
      label: editingAddress.label,
      fullName: editingAddress.fullName,
      phone: editingAddress.phone,
      city: editingAddress.city,
      address: editingAddress.address,
    } : undefined,
  })

  useDocumentTitle(ka.checkout.title)

  const isAnyMutationPending = updateQuantity.isPending || removeItem.isPending || createAddress.isPending || updateAddress.isPending

  // Filter items client-side if specific items were selected
  const filteredCheckout = useMemo(() => {
    if (!checkout) return null
    if (!selectedItemIds || selectedItemIds.length === 0) return checkout

    const filteredItems = checkout.items.filter(item => selectedItemIds.includes(item.id))
    return {
      ...checkout,
      items: filteredItems,
      totalQty: filteredItems.reduce((sum, item) => sum + item.qty, 0),
      subtotal: filteredItems.reduce((sum, item) => sum + item.lineTotal, 0),
      total: filteredItems.reduce((sum, item) => sum + item.lineTotal, 0) + checkout.shippingFee,
    }
  }, [checkout, selectedItemIds])

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
      fullName: filteredCheckout?.shipping?.fullName || '',
      phone: filteredCheckout?.shipping?.phone || '',
      city: filteredCheckout?.shipping?.city || '',
      address: filteredCheckout?.shipping?.address || '',
    }
  }, [filteredCheckout, selectedAddressId, addresses])

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
    console.log('handleNewAddress called')
    setEditingAddress(null)
    setShowAddressForm(true)
  }

  const handleEditAddress = (address: Address) => {
    console.log('handleEditAddress called', address)
    setEditingAddress(address)
    setShowAddressForm(true)
  }

  const handleCloseAddressForm = () => {
    setShowAddressForm(false)
    setEditingAddress(null)
  }

  const handleAddressFormSubmit = async (data: z.infer<typeof addressFormSchema>) => {
    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({ id: editingAddress.id, data })
      } else {
        await createAddress.mutateAsync(data as CreateAddressRequest)
      }
      handleCloseAddressForm()
      addressForm.reset()
    } catch (err) {
      console.error('Address save error:', err)
    }
  }

  const handleCheckoutSubmit = async (data: CheckoutFormData) => {
    setSubmitError(null)
    try {
      const result = await createOrder.mutateAsync(data as CreateOrderRequest)
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
      setSubmitError(getCheckoutErrorMessage(err))
    }
  }

  const handleConfirmSubmit = async (data: CodeFormData) => {
    if (!orderId) return
    setSubmitError(null)
    try {
      const result = await confirmOrder.mutateAsync({ orderId, data })
      setConfirmedOrder(result.order)
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
  if (step === 'form' && (!filteredCheckout || filteredCheckout.items.length === 0)) {
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

          <div className="checkout-page__summary">
            <h2 className="checkout-page__section-title">{ka.checkout.orderSummary}</h2>
            <div className="checkout-page__items">
              {filteredCheckout?.items.map((item) => {
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
                      {formatPrice(item.lineTotal, filteredCheckout?.currency)}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="checkout-page__totals">
              <div className="checkout-page__total-row">
                <span>{ka.cart.subtotal} ({filteredCheckout?.totalQty} ცალი)</span>
                <span>{formatPrice(filteredCheckout?.subtotal || 0, filteredCheckout?.currency)}</span>
              </div>
              <div className="checkout-page__total-row">
                <span>{ka.checkout.shippingInfo}</span>
                <span>{formatPrice(filteredCheckout?.shippingFee || 0, filteredCheckout?.currency)}</span>
              </div>
              <div className="checkout-page__total-row checkout-page__total-row--total">
                <span>{ka.checkout.total}</span>
                <span>{formatPrice(filteredCheckout?.total || 0, filteredCheckout?.currency)}</span>
              </div>
            </div>
          </div>

          <div className="checkout-page__form-section">
            <h2 className="checkout-page__section-title">{ka.checkout.shippingInfo}</h2>

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
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            console.log('Edit button clicked', address, 'isAnyMutationPending:', isAnyMutationPending)
                            e.stopPropagation()
                            handleEditAddress(address)
                          }}
                          disabled={isAnyMutationPending}
                          className="checkout-page__address-item-edit"
                        >
                          რედაქტირება
                        </Button>
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
                      console.log('New address button clicked', 'isAnyMutationPending:', isAnyMutationPending)
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
                      console.log('Change address clicked')
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
                    {...form.register('card.number')}
                  />
                )}
              </FormField>

              <FormField label={ka.checkout.cardHolder} error={form.formState.errors.card?.holder?.message}>
                {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                  <Input
                    id={id}
                    type="text"
                    autoComplete="cc-name"
                    placeholder="NAME ON CARD"
                    aria-describedby={ariaDescribedby}
                    aria-invalid={ariaInvalid}
                    error={!!form.formState.errors.card?.holder}
                    disabled={createOrder.isPending}
                    {...form.register('card.holder')}
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
                      {...form.register('card.expiry')}
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
                      {...form.register('card.cvc')}
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
          form={addressForm}
          isPending={createAddress.isPending || updateAddress.isPending}
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
            {ka.checkout.total}: {formatPrice(filteredCheckout?.total || 0, filteredCheckout?.currency)}
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
          form={addressForm}
          isPending={createAddress.isPending || updateAddress.isPending}
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
          form={addressForm}
          isPending={createAddress.isPending || updateAddress.isPending}
        />
      </div>
    </PageContainer>
  )
}

