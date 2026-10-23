import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../../../shared/ui/Button'
import { FormField } from '../../../../shared/ui/FormField'
import { Input } from '../../../../shared/ui/Input'
import { useLanguage, type Translations } from '../../../../shared/i18n/LanguageContext'

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'email_required')
    .email('email_invalid'),
})

const getErrorMessage = (key: string, t: Translations): string => {
  const map: Record<string, keyof Translations['validation']> = {
    email_required: 'emailRequired',
    email_invalid: 'emailInvalid',
  }
  const translationKey = map[key]
  return translationKey ? t.validation[translationKey] : t.common.genericError
}

type EmailFormData = z.infer<typeof emailSchema>

interface EmailStepProps {
  defaultEmail: string
  isLoading: boolean
  onSubmit(email: string): void
}

export function EmailStep({ defaultEmail, isLoading, onSubmit }: EmailStepProps) {
  const { t } = useLanguage()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { email: defaultEmail },
  })

  const translateErrorMessage = (msg: string | undefined): string | undefined => {
    if (!msg) return undefined
    return getErrorMessage(msg, t)
  }

  const submitHandler = async (values: EmailFormData) => {
    if (isLoading) return
    onSubmit(values.email)
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="forgot-password-page__form" noValidate>
      <FormField
        label={t.auth.emailLabel}
        error={translateErrorMessage(errors.email?.message)}
      >
        {(props: { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }) => (
          <Input
            id={props.id}
            type="email"
            placeholder={t.auth.emailPlaceholder}
            autoComplete="email"
            aria-describedby={props['aria-describedby']}
            aria-invalid={props['aria-invalid']}
            error={!!errors.email}
            {...register('email')}
          />
        )}
      </FormField>

      <div className="forgot-password-page__actions">
        <Button
          type="submit"
          loading={isLoading}
          className="forgot-password-page__submit"
        >
          {t.auth.forgot.sendCode}
        </Button>
      </div>
    </form>
  )
}

