import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { FormField } from '../../../shared/ui/FormField'
import { Input } from '../../../shared/ui/Input'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { Alert } from '../../../shared/ui/Alert'
import { setAccessToken, useSession, hasSessionExpiredNotice, clearSessionExpiredNotice } from '../../../shared/auth'
import { login } from '../api/login'
import { ApiErrorClass, applyServerErrors } from '../../../shared/api'
import { useLanguage, type Translations } from '../../../shared/i18n/LanguageContext'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import './LoginPage.css'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'email_required')
    .email('email_invalid'),
  password: z
    .string()
    .min(1, 'password_required'),
})

// Map placeholder error keys to translation keys
const getErrorMessage = (key: string, t: Translations): string => {
  const map: Record<string, keyof Translations['validation']> = {
    email_required: 'emailRequired',
    email_invalid: 'emailInvalid',
    password_required: 'passwordRequired',
  }
  const translationKey = map[key]
  return translationKey ? t.validation[translationKey] : t.common.genericError
}

type LoginFormData = z.infer<typeof loginSchema>

type LocationState = {
  from?: {
    pathname: string
    search?: string
    hash?: string
  }
}

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitErrorKey, setSubmitErrorKey] = useState<'genericError' | 'networkError' | 'invalidCredentials' | null>(null)
  const [showExpiredNotice] = useState(() => hasSessionExpiredNotice())
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useSession()
  const { t } = useLanguage()

  useDocumentTitle(t.auth.login.title)

  useEffect(() => {
    clearSessionExpiredNotice()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  // Translate zod error messages
  const translateErrorMessage = (msg: string | undefined): string | undefined => {
    if (!msg) return undefined
    return getErrorMessage(msg, t)
  }

  const onSubmit = async (values: LoginFormData) => {
    if (isLoading) return
    setSubmitErrorKey(null)
    setIsLoading(true)

    try {
      const response = await login(values)
      setAccessToken(response.accessToken)
      setUser(response.user)

      const from = (location.state as LocationState)?.from
      const to = from ? from.pathname + (from.search ?? '') + (from.hash ?? '') : ROUTES.catalog
      navigate(to, { replace: true })
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        if (error.code === 'INVALID_CREDENTIALS') {
          setSubmitErrorKey('invalidCredentials')
        } else if (error.status === 422) {
          const result = applyServerErrors(error, setError, ['email', 'password'])
          if (result.formError) {
            setSubmitErrorKey('genericError')
          } else if (!result.fieldErrorsSet) {
            setSubmitErrorKey('genericError')
          }
        } else {
          setSubmitErrorKey('genericError')
        }
      } else {
        setSubmitErrorKey('networkError')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__container">
        <h1 className="login-page__title">{t.auth.login.title}</h1>

        {showExpiredNotice && (
          <Alert variant="info" message={t.auth.login.sessionExpired} />
        )}

        {submitErrorKey && (
          <Alert variant="error" message={submitErrorKey === 'networkError' ? t.common.networkError : submitErrorKey === 'invalidCredentials' ? t.auth.login.invalidCredentials : t.common.genericError} className="login-page__alert" />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="login-page__form" noValidate>
          <FormField
            label={t.auth.emailLabel}
            error={translateErrorMessage(errors.email?.message)}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="email"
                placeholder={t.auth.emailPlaceholder}
                autoComplete="email"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.email}
                disabled={isLoading}
                {...register('email')}
              />
            )}
          </FormField>

          <FormField
            label={t.auth.passwordLabel}
            error={translateErrorMessage(errors.password?.message)}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <PasswordInput
                id={id}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.password}
                disabled={isLoading}
                {...register('password')}
              />
            )}
          </FormField>

          <div className="login-page__actions">
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="login-page__submit"
            >
              {t.auth.login.submit}
            </Button>
          </div>
        </form>

        <div className="login-page__links">
          <Link to="/forgot-password" className="login-page__link">
            {t.auth.login.forgot}
          </Link>
          <div className="login-page__register">
            {t.auth.login.noAccount}{' '}
            <Link to="/register" className="login-page__link">
              {t.auth.login.createAccount}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

