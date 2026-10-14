import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
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
import { ka } from '../../../shared/i18n/ka'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import type { Address } from '../hooks'
import './ProfilePage.css'

// Split schemas for personal info and password
const personalSchema = z.object({
  name: z.string().min(2, ka.validation.nameMin),
  email: z.string().email(ka.validation.emailInvalid),
  currentPassword: z.string().min(1, ka.profile.currentPasswordRequired),
})

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, ka.validation.passwordMin)
    .regex(/[a-zA-Z]/, ka.validation.passwordLetter)
    .regex(/\d/, ka.validation.passwordDigit),
  confirmPassword: z.string(),
  currentPassword: z.string().min(1, ka.profile.currentPasswordRequired),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: ka.validation.passwordsMismatch,
  path: ['confirmPassword'],
})

type PersonalFormData = z.infer<typeof personalSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { user, setUser } = useSession()
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
  const [addressError, setAddressError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'password'>('profile')

  useDocumentTitle(ka.profile.title)

  // Personal info form
  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    mode: 'onSubmit',
    values: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      currentPassword: '',
    },
  })

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onSubmit',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
      currentPassword: '',
    },
  })

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
    try {
      const payload: Partial<PersonalFormData> = {}
      if (personalForm.formState.dirtyFields.name) payload.name = values.name
      if (personalForm.formState.dirtyFields.email) payload.email = values.email
      if (personalForm.formState.dirtyFields.name || personalForm.formState.dirtyFields.email) {
        payload.currentPassword = values.currentPassword
      }

      const response = await updateProfile.mutateAsync(payload)

      setUser(response.user)
      setShowSuccess(true)
      personalForm.reset({ name: response.user.name, email: response.user.email, currentPassword: '' })
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === 'INVALID_CURRENT_PASSWORD') {
          personalForm.setError('currentPassword', { message: ka.profile.currentPasswordWrong }, { shouldFocus: true })
        } else if (err.code === 'EMAIL_TAKEN') {
          personalForm.setError('email', { message: ka.auth.register.emailTaken }, { shouldFocus: true })
        } else if (err.status === 422) {
          const result = applyServerErrors(err, personalForm.setError, ['name', 'email', 'currentPassword'])
          if (result.formError) {
            personalForm.setError('root', { message: result.formError })
          } else if (!result.fieldErrorsSet) {
            personalForm.setError('root', { message: ka.common.genericError })
          }
        } else {
          personalForm.setError('root', { message: ka.common.genericError })
        }
      } else {
        personalForm.setError('root', { message: ka.common.networkError })
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
          passwordForm.setError('currentPassword', { message: ka.profile.currentPasswordWrong }, { shouldFocus: true })
        } else if (err.status === 422) {
          const result = applyServerErrors(err, passwordForm.setError, ['newPassword', 'currentPassword'])
          if (result.formError) {
            passwordForm.setError('root', { message: result.formError })
          } else if (!result.fieldErrorsSet) {
            passwordForm.setError('root', { message: ka.common.genericError })
          }
        } else {
          passwordForm.setError('root', { message: ka.common.genericError })
        }
      } else {
        passwordForm.setError('root', { message: ka.common.networkError })
      }
    }
  }

  return (
    <PageContainer size="page" as="section">
      <h1 className="profile-page__title">{ka.profile.title}</h1>

      <div className="profile-page__layout">
        {/* Sidebar Navigation */}
        <nav className="profile-page__sidebar">
          <button
            className={`profile-page__nav-item ${activeTab === 'profile' ? 'profile-page__nav-item--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            პირადი ინფორმაცია
          </button>
          <button
            className={`profile-page__nav-item ${activeTab === 'addresses' ? 'profile-page__nav-item--active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            მისამართები
          </button>
          <button
            className={`profile-page__nav-item ${activeTab === 'password' ? 'profile-page__nav-item--active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            პაროლის შეცვლა
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
                <Alert variant="success" message={ka.profile.saved} className="profile-page__alert" />
              )}

              <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="profile-page__form" noValidate onChange={handlePersonalFormChange}>
                <div className="profile-page__section">
                  <h2 className="profile-page__section-title">{ka.profile.personal}</h2>

                  <FormField label={ka.profile.name} error={personalForm.formState.errors.name?.message}>
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

                  <FormField label={ka.profile.email} error={personalForm.formState.errors.email?.message}>
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
                  <h2 className="profile-page__section-title">{ka.profile.confirmSection}</h2>

                  <FormField label={ka.profile.currentPassword} error={personalForm.formState.errors.currentPassword?.message}>
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

                  <p className="profile-page__hint">{ka.profile.currentPasswordHint}</p>
                </div>

                <Button
                  type="submit"
                  loading={updateProfile.isPending}
                  disabled={!personalForm.formState.isDirty || updateProfile.isPending}
                >
                  {ka.profile.save}
                </Button>
              </form>
            </>
          )}

          {activeTab === 'addresses' && (
            <>
              <div className="profile-page__addresses">
                <div className="profile-page__addresses-header">
                  <h2 className="profile-page__section-title">მისამართები</h2>
                  <Button onClick={() => { setShowAddressForm(true); setAddressError(null) }} variant="secondary">
                    + დამატება
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
                              <Badge variant="success">მთავარი</Badge>
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
                              onClick={() => setDefaultAddress.mutate(address.id)}
                              disabled={setDefaultAddress.isPending}
                            >
                              მთავარი
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingAddress(address)
                              setShowAddressForm(true)
                            }}
                          >
                            რედაქტირება
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => setShowDeleteConfirm(address)}
                          >
                            წაშლა
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-page__addresses-empty">
                    <p>მისამართები არ არის</p>
                    <Button onClick={() => { setShowAddressForm(true); setAddressError(null) }} variant="secondary">
                      პირველი მისამართის დამატება
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'password' && (
            <>
              {showSuccess && (
                <Alert variant="success" message={ka.profile.saved} className="profile-page__alert" />
              )}

              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="profile-page__form" noValidate onChange={handlePasswordFormChange}>
                <div className="profile-page__section">
                  <h2 className="profile-page__section-title">{ka.profile.passwordSection}</h2>

                  <FormField label={ka.profile.newPassword} error={passwordForm.formState.errors.newPassword?.message}>
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

                  <FormField label={ka.profile.confirmNewPassword} error={passwordForm.formState.errors.confirmPassword?.message}>
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
                  <h2 className="profile-page__section-title">{ka.profile.confirmSection}</h2>

                  <FormField label={ka.profile.currentPassword} error={passwordForm.formState.errors.currentPassword?.message}>
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

                  <p className="profile-page__hint">{ka.profile.currentPasswordHint}</p>
                </div>

                <Button
                  type="submit"
                  loading={updateProfile.isPending}
                  disabled={!passwordForm.formState.isDirty || updateProfile.isPending}
                >
                  {ka.profile.save}
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
              {editingAddress ? 'მისამართის რედაქტირება' : 'ახალი მისამართის დამატება'}
            </h2>
            <button
              className="profile-page__modal-close"
              onClick={() => {
                setShowAddressForm(false)
                setEditingAddress(null)
                setAddressError(null)
              }}
            >
              ✕
            </button>
            {addressError && (
              <Alert variant="error" message={addressError} className="profile-page__modal-alert" />
            )}
            <AddressForm
              address={editingAddress}
              isLoading={createAddress.isPending || updateAddress.isPending}
              onCancel={() => {
                setShowAddressForm(false)
                setEditingAddress(null)
                setAddressError(null)
              }}
              onSubmit={(data) => {
                setAddressError(null)
                if (editingAddress) {
                  updateAddress.mutate(
                    { id: editingAddress.id, data },
                    {
                      onSuccess: () => {
                        setShowAddressForm(false)
                        setEditingAddress(null)
                      },
                      onError: (err) => {
                        console.error('Update address error:', err)
                        if (err instanceof ApiErrorClass) {
                          setAddressError(err.message || 'მისამართის რედაქტირება ვერ მოხერხდა')
                        } else {
                          setAddressError('მისამართის რედაქტირება ვერ მოხერხდა')
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
                        setAddressError(err.message || 'მისამართის დამატება ვერ მოხერხდა')
                      } else {
                        setAddressError('მისამართის დამატება ვერ მოხერხდა')
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
          title="მისამართის წაშლა"
          message="ნამდვილად გსურთ წაშლოთ ეს მისამართი?"
          confirmLabel="წაშლა"
          cancelLabel="გაუქმება"
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

// Address Form Component
function AddressForm({ address, onSubmit, isLoading, onCancel }: { address: Address | null; onSubmit: (data: { label: string; fullName: string; phone: string; city: string; address: string }) => void; isLoading: boolean; onCancel: () => void }) {
  const {
    register,
    handleSubmit,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="profile-page__address-form" noValidate>
      <FormField label="სახელწოდება" error={errors.label?.message}>
        {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
          <Input
            id={id}
            type="text"
            placeholder="მაგ: სახლი, ოფისი"
            aria-describedby={ariaDescribedby}
            aria-invalid={ariaInvalid}
            error={!!errors.label}
            {...register('label')}
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
            {...register('fullName')}
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
            {...register('phone', {
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
            {...register('city')}
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
            {...register('address')}
          />
        )}
      </FormField>

      <div className="profile-page__address-form-actions">
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {address ? 'შენახება' : 'დამატება'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          გაუქმება
        </Button>
      </div>
    </form>
  )
}
