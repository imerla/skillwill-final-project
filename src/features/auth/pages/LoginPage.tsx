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
import { ka } from '../../../shared/i18n/ka'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import './LoginPage.css'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, ka.validation.emailRequired)
    .email(ka.validation.emailInvalid),
  password: z
    .string()
    .min(1, ka.validation.passwordRequired),
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

  useDocumentTitle(ka.auth.login.title)

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
          setSubmitError(ka.auth.login.invalidCredentials)
        } else if (error.status === 422) {
          const result = applyServerErrors(error, setError, ['email', 'password'])
          if (result.formError) {
            setSubmitError(result.formError)
          } else if (!result.fieldErrorsSet) {
            setSubmitError(ka.common.genericError)
          }
        } else {
          setSubmitError(ka.common.genericError)
        }
      } else {
        setSubmitError(ka.common.networkError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__container">
        <h1 className="login-page__title">{ka.auth.login.title}</h1>

        {showExpiredNotice && (
          <Alert variant="info" message={ka.auth.login.sessionExpired} />
        )}

        {submitError && (
          <Alert variant="error" message={submitError} className="login-page__alert" />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="login-page__form" noValidate>
          <FormField
            label={ka.auth.emailLabel}
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
                {...register('email')}
              />
            )}
          </FormField>

          <FormField
            label={ka.auth.passwordLabel}
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
                {...register('password')}
              />
            )}
          </FormField>

          <div className="login-page__actions">
            <Button
              type="submit"
              loading={isLoading}
              className="login-page__submit"
            >
              {ka.auth.login.submit}
            </Button>
          </div>
        </form>

        <div className="login-page__links">
          <Link to="/forgot-password" className="login-page__link">
            {ka.auth.login.forgot}
          </Link>
          <div className="login-page__register">
            {ka.auth.login.noAccount}{' '}
            <Link to="/register" className="login-page__link">
              {ka.auth.login.createAccount}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

