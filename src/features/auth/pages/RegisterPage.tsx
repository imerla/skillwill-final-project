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
import { ApiErrorClass } from '../../../shared/api'
import './RegisterPage.css'

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/\d/, 'Password must contain at least one digit'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useSession()

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setFocus,
    trigger,
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
  })

  const onSubmit = async (values: RegisterFormData) => {
    setHasSubmitted(true)
    setSubmitError(null)
    setIsLoading(true)

    try {
      const response = await registerApi({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      setAccessToken(response.accessToken)
      setUser(response.user)
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        if (error.code === 'EMAIL_TAKEN') {
          setError('email', { message: 'ეს ელფოსტა უკვე რეგისტრირებულია' })
        } else if (error.status === 422 && error.errors) {
          Object.entries(error.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              setError(field as keyof RegisterFormData, { message: messages[0] })
            }
          })
        } else {
          setSubmitError('An error occurred. Please try again.')
        }
      } else {
        setSubmitError('Network error. Please check your connection.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onError = () => {
    setHasSubmitted(true)
    if (errors.name) {
      setFocus('name')
    } else if (errors.email) {
      setFocus('email')
    } else if (errors.password) {
      setFocus('password')
    } else if (errors.confirmPassword) {
      setFocus('confirmPassword')
    }
  }

  const handleChange = async (field: keyof RegisterFormData) => {
    if (hasSubmitted) {
      await trigger(field)
      if (field === 'password') {
        await trigger('confirmPassword')
      }
    }
  }

  return (
    <div className="register-page">
      <div className="register-page__container">
        <h1 className="register-page__title">Create account</h1>
        
        {submitError && (
          <Alert variant="error" message={submitError} className="register-page__alert" />
        )}

        <form onSubmit={handleSubmit(onSubmit, onError)} className="register-page__form" noValidate>
          <FormField
            label="Name"
            error={errors.name?.message}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="text"
                placeholder="John Doe"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.name}
                disabled={isLoading}
                {...registerField('name', { onChange: () => handleChange('name') })}
              />
            )}
          </FormField>

          <FormField
            label="Email"
            error={errors.email?.message}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <Input
                id={id}
                type="email"
                placeholder="you@example.com"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.email}
                disabled={isLoading}
                {...registerField('email', { onChange: () => handleChange('email') })}
              />
            )}
          </FormField>

          <FormField
            label="Password"
            error={errors.password?.message}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <PasswordInput
                id={id}
                placeholder="••••••••"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.password}
                disabled={isLoading}
                {...registerField('password', { onChange: () => handleChange('password') })}
              />
            )}
          </FormField>

          <FormField
            label="Confirm Password"
            error={errors.confirmPassword?.message}
          >
            {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
              <PasswordInput
                id={id}
                placeholder="••••••••"
                aria-describedby={ariaDescribedby}
                aria-invalid={ariaInvalid}
                error={!!errors.confirmPassword}
                disabled={isLoading}
                {...registerField('confirmPassword', { onChange: () => handleChange('confirmPassword') })}
              />
            )}
          </FormField>

          <div className="register-page__actions">
            <Button
              type="submit"
              loading={isLoading}
              className="register-page__submit"
            >
              Create account
            </Button>
          </div>
        </form>

        <div className="register-page__links">
          <div className="register-page__login">
            Already have an account?{' '}
            <Link to="/login" className="register-page__link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
