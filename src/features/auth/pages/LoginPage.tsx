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
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import './LoginPage.css'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

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
  const [submitError, setSubmitError] = useState<string | null>(null)
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

  const onSubmit = async (values: LoginFormData) => {
    if (isLoading) return
    setSubmitError(null)
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
          setSubmitError(t.auth.login.invalidCredentials)
        } else if (error.status === 422) {
          const result = applyServerErrors(error, setError, ['email', 'password'])
          if (result.formError) {
            setSubmitError(result.formError)
          } else if (!result.fieldErrorsSet) {
            setSubmitError(t.common.genericError)
          }
        } else {
          setSubmitError(t.common.genericError)
        }
      } else {
        setSubmitError(t.common.networkError)
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

        {submitError && (
          <Alert variant="error" message={submitError} className="login-page__alert" />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="login-page__form" noValidate>
          <FormField
            label={t.auth.emailLabel}
            error={errors.email?.message}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="email"
                placeholder="you@example.com"
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
            error={errors.password?.message}
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

