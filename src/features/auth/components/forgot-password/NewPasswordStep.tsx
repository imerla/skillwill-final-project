import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Button } from '../../../../shared/ui/Button'
import { FormField } from '../../../../shared/ui/FormField'
import { PasswordInput } from '../../../../shared/ui/PasswordInput'
import { ka } from '../../../../shared/i18n/ka'

const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, ka.validation.passwordRequired)
      .min(8, ka.validation.passwordMin)
      .regex(/[a-zA-Z]/, ka.validation.passwordLetter)
      .regex(/\d/, ka.validation.passwordDigit),
    confirmPassword: z
      .string()
      .min(1, ka.validation.confirmRequired),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: ka.validation.passwordsMismatch,
    path: ['confirmPassword'],
  })

type NewPasswordFormData = z.infer<typeof newPasswordSchema>

interface NewPasswordStepProps {
  isLoading: boolean
  onSubmit(newPassword: string): void
  fieldErrors?: { newPassword?: string }
}

export function NewPasswordStep({ isLoading, onSubmit, fieldErrors }: NewPasswordStepProps) {
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
        label={ka.auth.forgot.newPasswordLabel}
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
        label={ka.auth.forgot.confirmNewPasswordLabel}
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
          {ka.auth.forgot.resetSubmit}
        </Button>
      </div>
    </form>
  )
}

