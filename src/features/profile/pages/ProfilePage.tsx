import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateProfile, useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '../hooks'
import { useSession } from '../../../shared/auth'
import { ApiErrorClass, applyServerErrors } from '../../../shared/api'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { FormField } from '../../../shared/ui/FormField'
import { Input } from '../../../shared/ui/Input/Input'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { Alert } from '../../../shared/ui/Alert/Alert'
import { Badge } from '../../../shared/ui/Badge/Badge'
import { Skeleton } from '../../../shared/ui/Skeleton/Skeleton'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog/ConfirmDialog'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import type { Address } from '../hooks'
import './ProfilePage.css'

type PersonalFormData = {
  name: string
  email: string
  currentPassword: string
}

type PasswordFormData = {
  newPassword: string
  confirmPassword: string
  currentPassword: string
}

export function ProfilePage() {
  const { t } = useLanguage()
  const { user, setUser } = useSession()
  const queryClient = useQueryClient()
  const updateProfile = useUpdateProfile()
  const { data: addresses, isLoading: addressesLoading } = useAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefaultAddress = useSetDefaultAddress()
  const [showSuccess, setShowSuccess] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Address | null>(null)
  const [addressErrorKey, setAddressErrorKey] = useState<'editAddressError' | 'addAddressError' | null>(null)
  const [addressServerError, setAddressServerError] = useState<ApiErrorClass | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'password'>('profile')

  useDocumentTitle(t.profile.title)

  // Define schemas with dynamic translations - recreate when t changes
  const personalSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t.validation.nameMin),
        email: z.string().email(t.validation.emailInvalid),
        currentPassword: z.string().min(1, t.profile.currentPasswordRequired),
      }),
    [t]
  )

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          newPassword: z.string()
            .min(8, t.validation.passwordMin)
            .regex(/[a-zA-Z]/, t.validation.passwordLetter)
            .regex(/\d/, t.validation.passwordDigit),
          confirmPassword: z.string(),
          currentPassword: z.string().min(1, t.profile.currentPasswordRequired),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t.validation.passwordsMismatch,
          path: ['confirmPassword'],
        }),
    [t]
  )

  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    mode: 'onSubmit',
    values: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      currentPassword: '',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onSubmit',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
      currentPassword: '',
    },
  })

  const { trigger: personalTrigger } = personalForm
  const { trigger: passwordTrigger } = passwordForm

  // Revalidate forms when language changes
  useEffect(() => {
    personalTrigger()
  }, [t, personalTrigger])

  useEffect(() => {
    passwordTrigger()
  }, [t, passwordTrigger])

  const handlePersonalFormChange = () => {
    personalForm.clearErrors('root')
    if (showSuccess) {
      setShowSuccess(false)
    }
  }

  const handlePasswordFormChange = () => {
    passwordForm.clearErrors('root')
    if (showSuccess) {
      setShowSuccess(false)
    }
  }

  const onPersonalSubmit = async (values: PersonalFormData) => {
    setShowSuccess(false)

    // Nothing changed — should not happen since button is disabled when not dirty
    // but guard anyway
    const hasNameChange = personalForm.formState.dirtyFields.name
    const hasEmailChange = personalForm.formState.dirtyFields.email
    if (!hasNameChange && !hasEmailChange) return

    try {
      const payload: Record<string, string> = {
        currentPassword: values.currentPassword,
      }
      if (hasNameChange) payload.name = values.name
      if (hasEmailChange) payload.email = values.email

      const response = await updateProfile.mutateAsync(payload)

      setUser(response.user)
      setShowSuccess(true)
      personalForm.reset({ name: response.user.name, email: response.user.email, currentPassword: '' })
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === 'INVALID_CURRENT_PASSWORD') {
          personalForm.setError('currentPassword', { message: t.profile.currentPasswordWrong }, { shouldFocus: true })
        } else if (err.code === 'EMAIL_TAKEN') {
          personalForm.setError('email', { message: t.auth.register.emailTaken }, { shouldFocus: true })
        } else if (err.status === 422) {
          const result = applyServerErrors(err, personalForm.setError, ['name', 'email', 'currentPassword'])
          if (result.formError) {
            personalForm.setError('root', { message: result.formError })
          } else if (!result.fieldErrorsSet) {
            personalForm.setError('root', { message: t.common.genericError })
          }
        } else {
          personalForm.setError('root', { message: t.common.genericError })
        }
      } else {
        personalForm.setError('root', { message: t.common.networkError })
      }
    }
  }

  const onPasswordSubmit = async (values: PasswordFormData) => {
    setShowSuccess(false)
    try {
      const response = await updateProfile.mutateAsync({
        newPassword: values.newPassword,
        currentPassword: values.currentPassword,
      })

      setUser(response.user)
      setShowSuccess(true)
      passwordForm.reset()
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === 'INVALID_CURRENT_PASSWORD') {
          passwordForm.setError('currentPassword', { message: t.profile.currentPasswordWrong }, { shouldFocus: true })
        } else if (err.status === 422) {
          const result = applyServerErrors(err, passwordForm.setError, ['newPassword', 'currentPassword'])
          if (result.formError) {
            passwordForm.setError('root', { message: result.formError })
          } else if (!result.fieldErrorsSet) {
            passwordForm.setError('root', { message: t.common.genericError })
          }
        } else {
          passwordForm.setError('root', { message: t.common.genericError })
        }
      } else {
        passwordForm.setError('root', { message: t.common.networkError })
      }
    }
  }

  return (
    <PageContainer size="page" as="section">
      <h1 className="profile-page__title">{t.profile.title}</h1>

      <div className="profile-page__layout">
        {/* Sidebar Navigation */}
        <nav className="profile-page__sidebar">
          <button
            className={`profile-page__nav-item ${activeTab === 'profile' ? 'profile-page__nav-item--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {t.profile.personal}
          </button>
          <button
            className={`profile-page__nav-item ${activeTab === 'addresses' ? 'profile-page__nav-item--active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            {t.profile.addresses}
          </button>
          <button
            className={`profile-page__nav-item ${activeTab === 'password' ? 'profile-page__nav-item--active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            {t.profile.passwordSection}
          </button>
        </nav>

        {/* Content Area */}
        <div className="profile-page__content">
          {activeTab === 'profile' && (
            <>
              {personalForm.formState.errors.root && (
                <Alert variant="error" message={personalForm.formState.errors.root.message} className="profile-page__alert" />
              )}

              {showSuccess && (
                <Alert variant="success" message={t.profile.saved} className="profile-page__alert" />
              )}

              <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="profile-page__form" noValidate onChange={handlePersonalFormChange}>
                <div className="profile-page__section">
                  <h2 className="profile-page__section-title">{t.profile.personal}</h2>

                  <FormField label={t.profile.name} error={personalForm.formState.errors.name?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <Input
                        id={id}
                        type="text"
                        autoComplete="name"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!personalForm.formState.errors.name}
                        disabled={updateProfile.isPending}
                        {...personalForm.register('name')}
                      />
                    )}
                  </FormField>

                  <FormField label={t.profile.email} error={personalForm.formState.errors.email?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <Input
                        id={id}
                        type="email"
                        autoComplete="email"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!personalForm.formState.errors.email}
                        disabled={updateProfile.isPending}
                        {...personalForm.register('email')}
                      />
                    )}
                  </FormField>
                </div>

                <div className="profile-page__section">
                  <h2 className="profile-page__section-title">{t.profile.confirmSection}</h2>

                  <FormField label={t.profile.currentPassword} error={personalForm.formState.errors.currentPassword?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <PasswordInput
                        id={id}
                        autoComplete="current-password"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!personalForm.formState.errors.currentPassword}
                        disabled={updateProfile.isPending}
                        {...personalForm.register('currentPassword')}
                      />
                    )}
                  </FormField>

                  <p className="profile-page__hint">{t.profile.currentPasswordHint}</p>
                </div>

                <Button
                  type="submit"
                  loading={updateProfile.isPending}
                  disabled={!personalForm.formState.isDirty || updateProfile.isPending}
                >
                  {t.profile.save}
                </Button>
              </form>
            </>
          )}

          {activeTab === 'addresses' && (
            <>
              <div className="profile-page__addresses">
                <div className="profile-page__addresses-header">
                  <h2 className="profile-page__section-title">{t.profile.addresses}</h2>
                  <Button onClick={() => { setShowAddressForm(true); setAddressErrorKey(null); setAddressServerError(null) }} variant="secondary">
                    {t.profile.addAddress}
                  </Button>
                </div>

                {addressesLoading ? (
                  <div className="profile-page__addresses-list">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="profile-page__address-skeleton">
                        <Skeleton variant="rect" className="profile-page__address-skeleton-title" />
                        <Skeleton variant="rect" className="profile-page__address-skeleton-line" />
                        <Skeleton variant="rect" className="profile-page__address-skeleton-line" />
                      </div>
                    ))}
                  </div>
                ) : addresses && addresses.items.length > 0 ? (
                  <div className="profile-page__addresses-list">
                    {addresses.items.map((address) => (
                      <div key={address.id} className="profile-page__address-card">
                        <div className="profile-page__address-info">
                          <div className="profile-page__address-header">
                            <h3 className="profile-page__address-name">{address.label}</h3>
                            {address.isDefault && (
                              <Badge variant="success">{t.profile.defaultAddress}</Badge>
                            )}
                          </div>
                          <p className="profile-page__address-name-sub">{address.fullName}</p>
                          <p className="profile-page__address-phone">{address.phone}</p>
                          <p className="profile-page__address-location">
                            {address.city}, {address.address}
                          </p>
                        </div>
                        <div className="profile-page__address-actions">
                          {!address.isDefault && (
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setDefaultAddress.mutate(address.id, {
                                  onSuccess: () => {
                                    queryClient.invalidateQueries({ queryKey: ['addresses'] })
                                  },
                                  onSettled: () => {
                                    setShowSuccess(true)
                                    setTimeout(() => setShowSuccess(false), 3000)
                                  }
                                })
                              }}
                              disabled={setDefaultAddress.isPending}
                            >
                              {t.profile.setDefault}
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingAddress(address)
                              setShowAddressForm(true)
                            }}
                          >
                            {t.profile.editAddress}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => setShowDeleteConfirm(address)}
                          >
                            {t.profile.deleteAddress}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-page__addresses-empty">
                    <p>{t.profile.noAddresses}</p>
                    <Button onClick={() => { setShowAddressForm(true); setAddressErrorKey(null); setAddressServerError(null) }} variant="secondary">
                      {t.profile.addFirstAddress}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'password' && (
            <>
              {showSuccess && (
                <Alert variant="success" message={t.profile.saved} className="profile-page__alert" />
              )}

              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="profile-page__form" noValidate onChange={handlePasswordFormChange}>
                <div className="profile-page__section">
                  <h2 className="profile-page__section-title">{t.profile.passwordSection}</h2>

                  <FormField label={t.profile.newPassword} error={passwordForm.formState.errors.newPassword?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <PasswordInput
                        id={id}
                        autoComplete="new-password"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!passwordForm.formState.errors.newPassword}
                        disabled={updateProfile.isPending}
                        {...passwordForm.register('newPassword', { deps: ['confirmPassword'] })}
                      />
                    )}
                  </FormField>

                  <FormField label={t.profile.confirmNewPassword} error={passwordForm.formState.errors.confirmPassword?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <PasswordInput
                        id={id}
                        autoComplete="new-password"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!passwordForm.formState.errors.confirmPassword}
                        disabled={updateProfile.isPending}
                        {...passwordForm.register('confirmPassword')}
                      />
                    )}
                  </FormField>
                </div>

                <div className="profile-page__section">
                  <h2 className="profile-page__section-title">{t.profile.confirmSection}</h2>

                  <FormField label={t.profile.currentPassword} error={passwordForm.formState.errors.currentPassword?.message}>
                    {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                      <PasswordInput
                        id={id}
                        autoComplete="current-password"
                        aria-describedby={ariaDescribedby}
                        aria-invalid={ariaInvalid}
                        error={!!passwordForm.formState.errors.currentPassword}
                        disabled={updateProfile.isPending}
                        {...passwordForm.register('currentPassword')}
                      />
                    )}
                  </FormField>

                  <p className="profile-page__hint">{t.profile.currentPasswordHint}</p>
                </div>

                <Button
                  type="submit"
                  loading={updateProfile.isPending}
                  disabled={!passwordForm.formState.isDirty || updateProfile.isPending}
                >
                  {t.profile.save}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="profile-page__address-modal">
          <div className="profile-page__address-modal-content">
            <h2 className="profile-page__modal-title">
              {editingAddress ? t.profile.editAddressTitle : t.profile.newAddressTitle}
            </h2>
            <button
              className="profile-page__modal-close"
              onClick={() => {
                setShowAddressForm(false)
                setEditingAddress(null)
                setAddressErrorKey(null)
                setAddressServerError(null)
              }}
            >
              ✕
            </button>
            {addressErrorKey && (
              <Alert variant="error" message={addressErrorKey === 'editAddressError' ? t.profile.editAddressError : t.profile.addAddressError} className="profile-page__modal-alert" />
            )}
            <AddressForm
              address={editingAddress}
              isLoading={createAddress.isPending || updateAddress.isPending}
              serverError={addressServerError}
              onCancel={() => {
                setShowAddressForm(false)
                setEditingAddress(null)
                setAddressErrorKey(null)
                setAddressServerError(null)
              }}
              onSubmit={(data) => {
                setAddressErrorKey(null)
                setAddressServerError(null)
                if (editingAddress) {
                  updateAddress.mutate(
                    { id: editingAddress.id, data },
                    {
                      onSuccess: () => {
                        setShowAddressForm(false)
                        setEditingAddress(null)
                      },
                      onError: (err) => {
                        if (err instanceof ApiErrorClass) {
                          if (err.status === 422) {
                            setAddressServerError(err)
                          } else {
                            setAddressErrorKey('editAddressError')
                          }
                        } else {
                          setAddressErrorKey('editAddressError')
                        }
                      },
                    }
                  )
                } else {
                  createAddress.mutate(data, {
                    onSuccess: () => {
                      setShowAddressForm(false)
                    },
                    onError: (err) => {
                      if (err instanceof ApiErrorClass) {
                        if (err.status === 422) {
                          setAddressServerError(err)
                        } else {
                          setAddressErrorKey('addAddressError')
                        }
                      } else {
                        setAddressErrorKey('addAddressError')
                      }
                    },
                  })
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title={t.profile.deleteAddressTitle}
          message={t.profile.deleteAddressMessage}
          confirmLabel={t.profile.deleteAddressConfirm}
          cancelLabel={t.profile.deleteAddressCancel}
          onConfirm={() => {
            deleteAddress.mutate(showDeleteConfirm.id, {
              onSuccess: () => {
                setShowDeleteConfirm(null)
              },
            })
          }}
          onCancel={() => setShowDeleteConfirm(null)}
          variant="danger"
        />
      )}
    </PageContainer>
  )
}

function AddressForm({ address, onSubmit, isLoading, onCancel, serverError }: { address: Address | null; onSubmit: (data: { label: string; fullName: string; phone: string; city: string; address: string }) => void; isLoading: boolean; onCancel: () => void; serverError: ApiErrorClass | null }) {
  const { t } = useLanguage()
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<{ label: string; fullName: string; phone: string; city: string; address: string }>({
    defaultValues: address
      ? {
          label: address.label,
          fullName: address.fullName,
          phone: address.phone,
          city: address.city,
          address: address.address,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="profile-page__address-form" noValidate onChange={handleFormChange}>
      <FormField label={t.checkout.addressForm.label} error={errors.label?.message}>
        {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
          <Input
            id={id}
            type="text"
            placeholder={t.checkout.addressForm.labelPlaceholder}
            aria-describedby={ariaDescribedby}
            aria-invalid={ariaInvalid}
            error={!!errors.label}
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
            {...register('address', { required: t.checkout.addressForm.addressRequired })}
          />
        )}
      </FormField>

      <div className="profile-page__address-form-actions">
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {address ? t.checkout.addressForm.save : t.checkout.addressForm.add}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          {t.checkout.addressForm.cancel}
        </Button>
      </div>
    </form>
  )
}
