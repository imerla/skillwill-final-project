import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useUpdateProfile } from '../hooks'
import { useSession } from '../../../shared/auth'
import { ApiErrorClass, applyServerErrors } from '../../../shared/api'
import { PageContainer } from '../../../shared/ui/PageContainer/PageContainer'
import { Button } from '../../../shared/ui/Button/Button'
import { FormField } from '../../../shared/ui/FormField'
import { Input } from '../../../shared/ui/Input/Input'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { Alert } from '../../../shared/ui/Alert/Alert'
import { ka } from '../../../shared/i18n/ka'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import './ProfilePage.css'

const profileSchema = z
  .object({
    name: z.string().min(2, ka.validation.nameMin),
    email: z.string().email(ka.validation.emailInvalid),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || (val.length >= 9 && val.length <= 20), ka.profile.phoneInvalid)
      .refine((val) => !val || /^[+\d][\d\s()-]*$/.test(val), ka.profile.phoneInvalid),
    city: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 2, ka.profile.cityMin),
    address: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 5, ka.profile.addressMin),
    newPassword: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 8, ka.validation.passwordMin)
      .refine((val) => !val || /[a-zA-Z]/.test(val), ka.validation.passwordLetter)
      .refine((val) => !val || /\d/.test(val), ka.validation.passwordDigit),
    confirmPassword: z.string().optional(),
    currentPassword: z.string().min(1, ka.profile.currentPasswordRequired),
  })
  .refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
    message: ka.validation.passwordsMismatch,
    path: ['confirmPassword'],
  })

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user } = useSession()
  const updateProfile = useUpdateProfile()
  const { setUser } = useSession()
  const [showSuccess, setShowSuccess] = useState(false)

  useDocumentTitle(ka.profile.title)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, dirtyFields, isDirty },
    reset,
    setError,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    values: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      city: user?.city ?? '',
      address: user?.address ?? '',
      newPassword: '',
      confirmPassword: '',
      currentPassword: '',
    },
    resetOptions: { keepDirtyValues: true },
  })

  const handleFormChange = () => {
    if (errors.root) {
      setError('root', { message: undefined })
    }
    if (showSuccess) {
      setShowSuccess(false)
    }
  }

  const onSubmit = async (values: ProfileFormData) => {
    setShowSuccess(false)
    try {
      const payload: Partial<ProfileFormData> & { currentPassword: string } = {
        currentPassword: values.currentPassword,
      }

      if (dirtyFields.name) payload.name = values.name
      if (dirtyFields.email) payload.email = values.email
      if (dirtyFields.phone) payload.phone = values.phone || ''
      if (dirtyFields.city) payload.city = values.city || ''
      if (dirtyFields.address) payload.address = values.address || ''
      if (dirtyFields.newPassword && values.newPassword) {
        payload.newPassword = values.newPassword
      }

      const response = await updateProfile.mutateAsync(payload)

      setUser(response.user)
      setShowSuccess(true)

      reset({
        name: response.user.name,
        email: response.user.email,
        phone: response.user.phone ?? '',
        city: response.user.city ?? '',
        address: response.user.address ?? '',
        newPassword: '',
        confirmPassword: '',
        currentPassword: '',
      })
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        if (err.code === 'INVALID_CURRENT_PASSWORD') {
          setError('currentPassword', { message: ka.profile.currentPasswordWrong }, { shouldFocus: true })
        } else if (err.code === 'EMAIL_TAKEN') {
          setError('email', { message: ka.auth.register.emailTaken }, { shouldFocus: true })
        } else if (err.status === 422) {
          const result = applyServerErrors(err, setError, ['name', 'email', 'phone', 'city', 'address', 'newPassword', 'currentPassword'])
          if (result.hasUnderscoreError) {
            setError('root', { message: ka.profile.nothingToChange })
          } else if (result.formError) {
            setError('root', { message: result.formError })
          } else if (!result.fieldErrorsSet) {
            setError('root', { message: ka.common.genericError })
          }
        } else {
          setError('root', { message: ka.common.genericError })
        }
      } else {
        setError('root', { message: ka.common.networkError })
      }
    }
  }

  return (
    <PageContainer size="form" as="section">
      <h1 className="profile-page__title">{ka.profile.title}</h1>

      {errors.root && (
        <Alert variant="error" message={errors.root.message} className="profile-page__alert" />
      )}

      {showSuccess && (
        <Alert variant="success" message={ka.profile.saved} className="profile-page__alert" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="profile-page__form" noValidate onChange={handleFormChange}>
        <div className="profile-page__section">
          <h2 className="profile-page__section-title">{ka.profile.personal}</h2>

          <FormField label={ka.profile.name} error={errors.name?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                autoComplete="name"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.name}
                disabled={updateProfile.isPending}
                {...registerField('name')}
              />
            )}
          </FormField>

          <FormField label={ka.profile.email} error={errors.email?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="email"
                autoComplete="email"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.email}
                disabled={updateProfile.isPending}
                {...registerField('email')}
              />
            )}
          </FormField>

          <FormField label={ka.profile.phone} error={errors.phone?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="tel"
                placeholder={ka.profile.phonePlaceholder}
                autoComplete="tel"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.phone}
                disabled={updateProfile.isPending}
                {...registerField('phone')}
              />
            )}
          </FormField>
        </div>

        <div className="profile-page__section">
          <h2 className="profile-page__section-title">{ka.profile.addressSection}</h2>

          <FormField label={ka.profile.city} error={errors.city?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                autoComplete="address-level2"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.city}
                disabled={updateProfile.isPending}
                {...registerField('city')}
              />
            )}
          </FormField>

          <FormField label={ka.profile.address} error={errors.address?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                autoComplete="street-address"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.address}
                disabled={updateProfile.isPending}
                {...registerField('address')}
              />
            )}
          </FormField>

          <p className="profile-page__note">{ka.profile.addressNote}</p>
        </div>

        <div className="profile-page__section">
          <h2 className="profile-page__section-title">{ka.profile.passwordSection}</h2>

          <FormField label={ka.profile.newPassword} error={errors.newPassword?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <PasswordInput
                id={id}
                autoComplete="new-password"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.newPassword}
                disabled={updateProfile.isPending}
                {...registerField('newPassword', { deps: ['confirmPassword'] })}
              />
            )}
          </FormField>

          <FormField label={ka.profile.confirmNewPassword} error={errors.confirmPassword?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <PasswordInput
                id={id}
                autoComplete="new-password"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.confirmPassword}
                disabled={updateProfile.isPending}
                {...registerField('confirmPassword')}
              />
            )}
          </FormField>
        </div>

        <div className="profile-page__section">
          <h2 className="profile-page__section-title">{ka.profile.confirmSection}</h2>

          <FormField label={ka.profile.currentPassword} error={errors.currentPassword?.message}>
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <PasswordInput
                id={id}
                autoComplete="current-password"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.currentPassword}
                disabled={updateProfile.isPending}
                {...registerField('currentPassword')}
              />
            )}
          </FormField>

          <p className="profile-page__hint">{ka.profile.currentPasswordHint}</p>
        </div>

        <Button
          type="submit"
          loading={updateProfile.isPending}
          disabled={!isDirty || updateProfile.isPending}
        >
          {ka.profile.save}
        </Button>
      </form>
    </PageContainer>
  )
}

