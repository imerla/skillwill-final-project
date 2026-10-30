import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect, useMemo } from 'react'
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
  const [submitErrorKey, setSubmitErrorKey] = useState<'genericError' | 'networkError' | null>(null)
  const navigate = useNavigate()
  const { setUser } = useSession()

  useDocumentTitle(t.auth.register.title)

  // Define schema with dynamic translations - recreate when t changes
  const registerSchema = useMemo(
    () =>
      z
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
        }),
    [t]
  )

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, submitCount },
    setError,
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  // Revalidate form on language change only after the user has submitted it
  useEffect(() => {
    if (submitCount > 0) {
      void trigger()
    }
  }, [t, trigger, submitCount])

  const onSubmit = async (values: RegisterFormData) => {
    if (isLoading) return
    setSubmitErrorKey(null)
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
        if (error.code === 'EMAIL_TAKEN' || error.status === 409) {
          setError('email', { message: t.auth.register.emailTaken })
        } else if (error.status === 422) {
          const result = applyServerErrors(error, setError, ['name', 'email', 'password'])
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
    <div className="register-page">
      <div className="register-page__container">
        <h1 className="register-page__title">{t.auth.register.title}</h1>

        {submitErrorKey && (
          <Alert variant="error" message={submitErrorKey === 'networkError' ? t.common.networkError : t.common.genericError} className="register-page__alert" />
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
                disabled={isLoading}
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
                placeholder={t.auth.emailPlaceholder}
                autoComplete="email"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.email}
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
                {...registerField('confirmPassword')}
              />
            )}
          </FormField>

          <div className="register-page__actions">
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
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

