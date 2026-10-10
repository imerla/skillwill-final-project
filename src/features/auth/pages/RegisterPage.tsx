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
import { ka } from '../../../shared/i18n/ka'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { ROUTES } from '../../../app/routes'
import './RegisterPage.css'

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, ka.validation.nameRequired)
      .min(2, ka.validation.nameMin),
    email: z
      .string()
      .min(1, ka.validation.emailRequired)
      .email(ka.validation.emailInvalid),
    password: z
      .string()
      .min(1, ka.validation.passwordRequired)
      .min(8, ka.validation.passwordMin)
      .regex(/[a-zA-Z]/, ka.validation.passwordLetter)
      .regex(/\d/, ka.validation.passwordDigit),
    confirmPassword: z
      .string()
      .min(1, ka.validation.confirmRequired),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ka.validation.passwordsMismatch,
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setUser } = useSession()

  useDocumentTitle(ka.auth.register.title)

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
          setError('email', { message: ka.auth.register.emailTaken })
        } else if (error.status === 422) {
          const result = applyServerErrors(error, setError, ['name', 'email', 'password'])
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
    <div className="register-page">
      <div className="register-page__container">
        <h1 className="register-page__title">{ka.auth.register.title}</h1>

        {submitError && (
          <Alert variant="error" message={submitError} className="register-page__alert" />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="register-page__form" noValidate>
          <FormField
            label={ka.auth.nameLabel}
            error={errors.name?.message}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder={ka.auth.namePlaceholder}
                autoComplete="name"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.name}
                {...registerField('name')}
              />
            )}
          </FormField>

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
                {...registerField('email')}
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
                autoComplete="new-password"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.password}
                {...registerField('password', { deps: ['confirmPassword'] })}
              />
            )}
          </FormField>

          <FormField
            label={ka.auth.register.confirmLabel}
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
              {ka.auth.register.submit}
            </Button>
          </div>
        </form>

        <div className="register-page__links">
          <div className="register-page__login">
            {ka.auth.register.haveAccount}{' '}
            <Link to="/login" className="register-page__link">
              {ka.auth.register.signIn}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

