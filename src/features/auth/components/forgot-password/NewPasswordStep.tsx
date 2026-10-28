import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Button } from '../../../../shared/ui/Button'
import { FormField } from '../../../../shared/ui/FormField'
import { PasswordInput } from '../../../../shared/ui/PasswordInput'
import { useLanguage, type Translations } from '../../../../shared/i18n/LanguageContext'

const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'password_required')
      .min(8, 'password_min')
      .regex(/[a-zA-Z]/, 'password_letter')
      .regex(/\d/, 'password_digit'),
    confirmPassword: z
      .string()
      .min(1, 'confirm_required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'passwords_mismatch',
    path: ['confirmPassword'],
  })

const getErrorMessage = (key: string, t: Translations): string => {
  const map: Record<string, keyof Translations['validation']> = {
    password_required: 'passwordRequired',
    password_min: 'passwordMin',
    password_letter: 'passwordLetter',
    password_digit: 'passwordDigit',
    confirm_required: 'confirmRequired',
    passwords_mismatch: 'passwordsMismatch',
  }
  const translationKey = map[key]
  return translationKey ? t.validation[translationKey] : t.common.genericError
}

type NewPasswordFormData = z.infer<typeof newPasswordSchema>

interface NewPasswordStepProps {
  isLoading: boolean
  onSubmit(newPassword: string): void
  fieldErrors?: { newPassword?: string; confirmPassword?: string }
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

  const translateErrorMessage = (msg: string | undefined): string | undefined => {
    if (!msg) return undefined
    return getErrorMessage(msg, t)
  }

  useEffect(() => {
    if (fieldErrors?.newPassword) {
      setError('newPassword', { type: 'server', message: fieldErrors.newPassword }, { shouldFocus: true })
    }
    if (fieldErrors?.confirmPassword) {
      setError('confirmPassword', { type: 'server', message: fieldErrors.confirmPassword }, { shouldFocus: true })
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
        error={translateErrorMessage(errors.newPassword?.message)}
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
        error={translateErrorMessage(errors.confirmPassword?.message)}
      >
        {(props: { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }) => (
          <PasswordInput
            id={props.id}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-describedby={props['aria-describedby']}
            aria-invalid={props['aria-invalid']}
            error={!!errors.confirmPassword}
            {...register('confirmPassword', { deps: ['newPassword'] })}
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

