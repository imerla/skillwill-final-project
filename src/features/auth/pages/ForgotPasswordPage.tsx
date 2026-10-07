import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { FormField } from '../../../shared/ui/FormField'
import { Input } from '../../../shared/ui/Input'
import { Alert } from '../../../shared/ui/Alert'
import './ForgotPasswordPage.css'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
    trigger,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onSubmit',
  })

  const onSubmit = async (values: ForgotPasswordFormData) => {
    setHasSubmitted(true)
    setSubmitError(null)
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      console.log(values)
      setShowSuccess(true)
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
    }
  }

  const handleChange = async () => {
    if (hasSubmitted) {
      await trigger('email')
    }
  }

  if (showSuccess) {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-page__container">
          <Alert 
            variant="success" 
            message="If an account exists for this email, we've sent a reset link." 
            className="forgot-password-page__success"
          />
          <div className="forgot-password-page__links">
            <Link to="/login" className="forgot-password-page__link">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__container">
        <h1 className="forgot-password-page__title">Reset password</h1>
        <p className="forgot-password-page__subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {submitError && (
          <Alert variant="error" message={submitError} className="forgot-password-page__alert" />
        )}

        <form onSubmit={handleSubmit(onSubmit, onError)} className="forgot-password-page__form" noValidate>
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
                {...register('email', { onChange: handleChange })}
              />
            )}
          </FormField>

          <div className="forgot-password-page__actions">
            <Button
              type="submit"
              loading={isLoading}
              className="forgot-password-page__submit"
            >
              Send reset link
            </Button>
          </div>
        </form>

        <div className="forgot-password-page__links">
          <Link to="/login" className="forgot-password-page__link">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
