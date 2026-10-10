import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Button } from '../../../../shared/ui/Button'
import { FormField } from '../../../../shared/ui/FormField'
import { Input } from '../../../../shared/ui/Input'
import { ka } from '../../../../shared/i18n/ka'

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, ka.validation.codeInvalid),
})

type CodeFormData = z.infer<typeof codeSchema>

interface CodeStepProps {
  isLoading: boolean
  onSubmit(code: string): void
  onChangeEmail(): void
  onRequestNewCode(): void
  tooManyAttempts: boolean
  fieldError?: string | null
}

export function CodeStep({ isLoading, onSubmit, onChangeEmail, onRequestNewCode, tooManyAttempts, fieldError }: CodeStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  useEffect(() => {
    if (fieldError) {
      setError('code', { type: 'server', message: fieldError }, { shouldFocus: true })
    }
  }, [fieldError, setError])

  const submitHandler = async (values: CodeFormData) => {
    if (isLoading) return
    onSubmit(values.code)
  }

  return (
    <>
      <form onSubmit={handleSubmit(submitHandler)} className="forgot-password-page__form" noValidate>
        <FormField
          label={ka.auth.forgot.codeLabel}
          error={errors.code?.message}
        >
          {(props: { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }) => (
            <Input
              id={props.id}
              type="text"
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-describedby={props['aria-describedby']}
              aria-invalid={props['aria-invalid']}
              error={!!errors.code}
              {...register('code')}
            />
          )}
        </FormField>

        <div className="forgot-password-page__actions">
          <Button
            type="submit"
            loading={isLoading}
            className="forgot-password-page__submit"
          >
            {ka.auth.forgot.verifyCode}
          </Button>
        </div>

        <div className="forgot-password-page__links">
          <button
            type="button"
            onClick={onChangeEmail}
            className="forgot-password-page__link"
          >
            {ka.auth.forgot.changeEmail}
          </button>
          {tooManyAttempts && (
            <button
              type="button"
              onClick={onRequestNewCode}
              className="forgot-password-page__link"
            >
              {ka.auth.forgot.requestNewCode}
            </button>
          )}
        </div>
      </form>
    </>
  )
}

