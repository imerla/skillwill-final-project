import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Button } from '../../../../shared/ui/Button'
import { FormField } from '../../../../shared/ui/FormField'
import { PasswordInput } from '../../../../shared/ui/PasswordInput'
import { useLanguage } from '../../../../shared/i18n/LanguageContext'

const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/\d/, 'Password must contain at least one digit'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type NewPasswordFormData = z.infer<typeof newPasswordSchema>

interface NewPasswordStepProps {
  isLoading: boolean
  onSubmit(newPassword: string): void
  fieldErrors?: { newPassword?: string }
}

export function NewPasswordStep({ isLoading, onSubmit, fieldErrors }: NewPasswordStepProps) {
  const { t } = useLanguage()
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  useEffect(() => {
    if (fieldErrors?.newPassword) {
      setError('newPassword', { type: 'server', message: fieldErrors.newPassword }, { shouldFocus: true })
    }
  }, [fieldErrors, setError])

  const submitHandler = async (values: NewPasswordFormData) => {
    if (isLoading) return
    onSubmit(values.newPassword)
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="forgot-password-page__form" noValidate>
      <FormField
        label={t.auth.forgot.newPasswordLabel}
        error={errors.newPassword?.message}
      >
        {(props: { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }) => (
          <PasswordInput
            id={props.id}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-describedby={props['aria-describedby']}
            aria-invalid={props['aria-invalid']}
            error={!!errors.newPassword}
            {...register('newPassword', { deps: ['confirmPassword'] })}
          />
        )}
      </FormField>

      <FormField
        label={t.auth.forgot.confirmNewPasswordLabel}
        error={errors.confirmPassword?.message}
      >
        {(props: { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }) => (
          <PasswordInput
            id={props.id}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-describedby={props['aria-describedby']}
            aria-invalid={props['aria-invalid']}
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        )}
      </FormField>

      <div className="forgot-password-page__actions">
        <Button
          type="submit"
          loading={isLoading}
          className="forgot-password-page__submit"
        >
          {t.auth.forgot.resetSubmit}
        </Button>
      </div>
    </form>
  )
}

