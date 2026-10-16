import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../../../shared/ui/Button'
import { FormField } from '../../../../shared/ui/FormField'
import { Input } from '../../../../shared/ui/Input'
import { useLanguage } from '../../../../shared/i18n/LanguageContext'

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
})

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

  const submitHandler = async (values: EmailFormData) => {
    if (isLoading) return
    onSubmit(values.email)
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="forgot-password-page__form" noValidate>
      <FormField
        label={t.auth.emailLabel}
        error={errors.email?.message}
      >
        {(props: { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }) => (
          <Input
            id={props.id}
            type="email"
            placeholder="you@example.com"
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

