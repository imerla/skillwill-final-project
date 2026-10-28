import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Button } from '../../../../shared/ui/Button'
import { FormField } from '../../../../shared/ui/FormField'
import { Input } from '../../../../shared/ui/Input'
import { useLanguage, type Translations } from '../../../../shared/i18n/LanguageContext'

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'code_invalid'),
})

const getErrorMessage = (key: string, t: Translations): string => {
  const map: Record<string, keyof Translations['validation']> = {
    code_invalid: 'codeInvalid',
  }
  const translationKey = map[key]
  return translationKey ? t.validation[translationKey] : t.common.genericError
}

type CodeFormData = z.infer<typeof codeSchema>

interface CodeStepProps {
  isLoading: boolean
  onSubmit(code: string): void
  onChangeEmail(): void
  onRequestNewCode(): void
  tooManyAttempts: boolean
  fieldError?: string | null
  devCode?: string | null
  resendTimer?: number | null
}

export function CodeStep({ isLoading, onSubmit, onChangeEmail, onRequestNewCode, tooManyAttempts, fieldError, devCode, resendTimer }: CodeStepProps) {
  const { t } = useLanguage()
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

  const translateErrorMessage = (msg: string | undefined): string | undefined => {
    if (!msg) return undefined
    return getErrorMessage(msg, t)
  }

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
          label={t.auth.forgot.codeLabel}
          error={translateErrorMessage(errors.code?.message)}
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

        {devCode && (
          <div className="forgot-password-page__dev-code">
            {t.auth.forgot.devCode}: <strong>{devCode}</strong>
          </div>
        )}

        <div className="forgot-password-page__actions">
          <Button
            type="submit"
            loading={isLoading}
            className="forgot-password-page__submit"
          >
            {t.auth.forgot.verifyCode}
          </Button>
        </div>

        <div className="forgot-password-page__links">
          <button
            type="button"
            onClick={onChangeEmail}
            className="forgot-password-page__link"
          >
            {t.auth.forgot.changeEmail}
          </button>
          {(tooManyAttempts || resendTimer === null) && (
            <button
              type="button"
              onClick={onRequestNewCode}
              disabled={resendTimer !== null}
              className="forgot-password-page__link"
            >
              {resendTimer !== null
                ? t.auth.forgot.resendTimer(resendTimer!)
                : t.auth.forgot.requestNewCode}
            </button>
          )}
        </div>
      </form>
    </>
  )
}

