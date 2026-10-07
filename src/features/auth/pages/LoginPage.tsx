import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { FormField } from '../../../shared/ui/FormField'
import { Input } from '../../../shared/ui/Input'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { Alert } from '../../../shared/ui/Alert'
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

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
    trigger,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  })

  const onSubmit = async (values: LoginFormData) => {
    setHasSubmitted(true)
    setSubmitError(null)
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      console.log(values)
    } catch {
      setSubmitError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onError = () => {
    setHasSubmitted(true)
    if (errors.email) {
      setFocus('email')
    } else if (errors.password) {
      setFocus('password')
    }
  }

  const handleChange = async (field: keyof LoginFormData) => {
    if (hasSubmitted) {
      await trigger(field)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__container">
        <h1 className="login-page__title">Sign in</h1>
        
        {submitError && (
          <Alert variant="error" message={submitError} className="login-page__alert" />
        )}

        <form onSubmit={handleSubmit(onSubmit, onError)} className="login-page__form" noValidate>
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
                {...register('email', { onChange: () => handleChange('email') })}
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
                {...register('password', { onChange: () => handleChange('password') })}
              />
            )}
          </FormField>

          <div className="login-page__actions">
            <Button
              type="submit"
              loading={isLoading}
              className="login-page__submit"
            >
              Sign in
            </Button>
          </div>
        </form>

        <div className="login-page__links">
          <Link to="/forgot-password" className="login-page__link">
            Forgot password?
          </Link>
          <div className="login-page__register">
            Don't have an account?{' '}
            <Link to="/register" className="login-page__link">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
