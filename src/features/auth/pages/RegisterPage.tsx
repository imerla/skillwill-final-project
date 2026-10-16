import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { FormField } from '../../../shared/ui/FormField'
import { Input } from '../../../shared/ui/Input'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { Alert } from '../../../shared/ui/Alert'
import { setAccessToken, useSession } from '../../../shared/auth'
import { register as registerApi } from '../api/register'
import { ApiErrorClass, applyServerErrors } from '../../../shared/api'
import { useLanguage } from '../../../shared/i18n/LanguageContext'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import './RegisterPage.css'

type RegisterFormData = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export function RegisterPage() {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setUser } = useSession()

  useDocumentTitle(t.auth.register.title)

  // Define schema with dynamic translations
  const registerSchema = z
    .object({
      name: z
        .string()
        .min(1, t.validation.nameRequired)
        .min(2, t.validation.nameMin),
      email: z
        .string()
        .min(1, t.validation.emailRequired)
        .email(t.validation.emailInvalid),
      password: z
        .string()
        .min(1, t.validation.passwordRequired)
        .min(8, t.validation.passwordMin)
        .regex(/[a-zA-Z]/, t.validation.passwordLetter)
        .regex(/\d/, t.validation.passwordDigit),
      confirmPassword: z
        .string()
        .min(1, t.validation.confirmRequired),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.validation.passwordsMismatch,
      path: ['confirmPassword'],
    })

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const onSubmit = async (values: RegisterFormData) => {
    if (isLoading) return
    setSubmitError(null)
    setIsLoading(true)

    try {
      const response = await registerApi({
        name: values.name.trim(),
        email: values.email,
        password: values.password,
      })
      setAccessToken(response.accessToken)
      setUser(response.user)
      navigate(ROUTES.catalog, { replace: true })
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        if (error.code === 'EMAIL_TAKEN') {
          setError('email', { message: t.auth.register.emailTaken })
        } else if (error.status === 422) {
          const result = applyServerErrors(error, setError, ['name', 'email', 'password'])
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
    <div className="register-page">
      <div className="register-page__container">
        <h1 className="register-page__title">{t.auth.register.title}</h1>

        {submitError && (
          <Alert variant="error" message={submitError} className="register-page__alert" />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="register-page__form" noValidate>
          <FormField
            label={t.auth.nameLabel}
            error={errors.name?.message}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder={t.auth.namePlaceholder}
                autoComplete="name"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.name}
                {...registerField('name')}
              />
            )}
          </FormField>

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
                {...registerField('email')}
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
                autoComplete="new-password"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.password}
                {...registerField('password', { deps: ['confirmPassword'] })}
              />
            )}
          </FormField>

          <FormField
            label={t.auth.register.confirmLabel}
            error={errors.confirmPassword?.message}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <PasswordInput
                id={id}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.confirmPassword}
                {...registerField('confirmPassword')}
              />
            )}
          </FormField>

          <div className="register-page__actions">
            <Button
              type="submit"
              loading={isLoading}
              className="register-page__submit"
            >
              {t.auth.register.submit}
            </Button>
          </div>
        </form>

        <div className="register-page__links">
          <div className="register-page__login">
            {t.auth.register.haveAccount}{' '}
            <Link to="/login" className="register-page__link">
              {t.auth.register.signIn}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

