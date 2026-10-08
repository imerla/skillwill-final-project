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
import { forgotPassword, verifyResetCode, resetPassword } from '../api/forgotPassword'
import { ApiErrorClass } from '../../../shared/api'
import './ForgotPasswordPage.css'

type Step = 'email' | 'code' | 'newPassword' | 'success'

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
})

const codeSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .min(6, 'Code must be at least 6 characters'),
})

const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/\d/, 'Password must contain at least one digit'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState<string | null>(null)

  const [emailHasSubmitted, setEmailHasSubmitted] = useState(false)
  const [codeHasSubmitted, setCodeHasSubmitted] = useState(false)
  const [passwordHasSubmitted, setPasswordHasSubmitted] = useState(false)

  const emailForm = useForm({ resolver: zodResolver(emailSchema), mode: 'onSubmit' })
  const codeForm = useForm({ resolver: zodResolver(codeSchema), mode: 'onSubmit' })
  const passwordForm = useForm({ resolver: zodResolver(newPasswordSchema), mode: 'onSubmit' })

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setEmailHasSubmitted(true)
    setSubmitError(null)
    setErrorCode(null)
    setIsLoading(true)
    setEmail(values.email)

    try {
      await forgotPassword({ email: values.email })
      setStep('code')
    } catch {
      setSubmitError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onCodeSubmit = async (values: z.infer<typeof codeSchema>) => {
    setCodeHasSubmitted(true)
    setSubmitError(null)
    setErrorCode(null)
    setIsLoading(true)

    try {
      const response = await verifyResetCode({ email, code: values.code })
      setResetToken(response.resetToken)
      setStep('newPassword')
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        if (error.code === 'INVALID_RESET_CODE') {
          codeForm.setError('code', { message: 'კოდი არასწორია ან ვადაგასულია' })
        } else if (error.code === 'TOO_MANY_ATTEMPTS') {
          setSubmitError('Too many attempts. Please request a new code.')
          setErrorCode('TOO_MANY_ATTEMPTS')
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

  const onPasswordSubmit = async (values: z.infer<typeof newPasswordSchema>) => {
    setPasswordHasSubmitted(true)
    setSubmitError(null)
    setErrorCode(null)
    setIsLoading(true)

    try {
      if (!resetToken) {
        setSubmitError('Invalid session. Please start over.')
        setStep('email')
        return
      }

      await resetPassword({ resetToken, newPassword: values.newPassword })
      setStep('success')
    } catch {
      setSubmitError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestNewCode = () => {
    setStep('email')
    setSubmitError(null)
    setErrorCode(null)
    codeForm.reset()
    setCodeHasSubmitted(false)
  }

  const handleEmailChange = async () => {
    if (emailHasSubmitted) {
      await emailForm.trigger('email')
    }
  }

  const handleCodeChange = async () => {
    if (codeHasSubmitted) {
      await codeForm.trigger('code')
    }
  }

  const handleNewPasswordChange = async () => {
    if (passwordHasSubmitted) {
      await passwordForm.trigger('newPassword')
      await passwordForm.trigger('confirmPassword')
    }
  }

  const handleConfirmPasswordChange = async () => {
    if (passwordHasSubmitted) {
      await passwordForm.trigger('confirmPassword')
    }
  }

  if (step === 'success') {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-page__container">
          <Alert 
            variant="success" 
            message="Password reset successful. You can now sign in with your new password." 
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
        <h1 className="forgot-password-page__title">
          {step === 'email' && 'Reset password'}
          {step === 'code' && 'Enter verification code'}
          {step === 'newPassword' && 'Create new password'}
        </h1>
        
        {step === 'email' && (
          <p className="forgot-password-page__subtitle">
            Enter your email address and we'll send you a code to reset your password.
          </p>
        )}

        {step === 'code' && (
          <p className="forgot-password-page__subtitle">
            Enter the 6-digit code sent to {email}
          </p>
        )}

        {submitError && (
          <Alert variant="error" message={submitError} className="forgot-password-page__alert" />
        )}

        {step === 'email' && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="forgot-password-page__form" noValidate>
            <FormField
              label="Email"
              error={emailForm.formState.errors.email?.message}
            >
              {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                <Input
                  id={id}
                  type="email"
                  placeholder="you@example.com"
                  aria-describedby={ariaDescribedby}
                  aria-invalid={ariaInvalid}
                  error={!!emailForm.formState.errors.email}
                  disabled={isLoading}
                  {...emailForm.register('email', { onChange: handleEmailChange })}
                />
              )}
            </FormField>

            <div className="forgot-password-page__actions">
              <Button
                type="submit"
                loading={isLoading}
                className="forgot-password-page__submit"
              >
                Send code
              </Button>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="forgot-password-page__form" noValidate>
            <FormField
              label="Verification code"
              error={codeForm.formState.errors.code?.message}
            >
              {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                <Input
                  id={id}
                  type="text"
                  placeholder="123456"
                  aria-describedby={ariaDescribedby}
                  aria-invalid={ariaInvalid}
                  error={!!codeForm.formState.errors.code}
                  disabled={isLoading}
                  {...codeForm.register('code', { onChange: handleCodeChange })}
                />
              )}
            </FormField>

            <div className="forgot-password-page__actions">
              <Button
                type="submit"
                loading={isLoading}
                className="forgot-password-page__submit"
              >
                Verify code
              </Button>
            </div>

            {errorCode === 'TOO_MANY_ATTEMPTS' && (
              <div className="forgot-password-page__links">
                <button
                  type="button"
                  onClick={handleRequestNewCode}
                  className="forgot-password-page__link"
                  disabled={isLoading}
                >
                  ახალი კოდის მოთხოვნა
                </button>
              </div>
            )}
          </form>
        )}

        {step === 'newPassword' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="forgot-password-page__form" noValidate>
            <FormField
              label="New password"
              error={passwordForm.formState.errors.newPassword?.message}
            >
              {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                <PasswordInput
                  id={id}
                  placeholder="••••••••"
                  aria-describedby={ariaDescribedby}
                  aria-invalid={ariaInvalid}
                  error={!!passwordForm.formState.errors.newPassword}
                  disabled={isLoading}
                  {...passwordForm.register('newPassword', { onChange: handleNewPasswordChange })}
                />
              )}
            </FormField>

            <FormField
              label="Confirm new password"
              error={passwordForm.formState.errors.confirmPassword?.message}
            >
              {({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }) => (
                <PasswordInput
                  id={id}
                  placeholder="••••••••"
                  aria-describedby={ariaDescribedby}
                  aria-invalid={ariaInvalid}
                  error={!!passwordForm.formState.errors.confirmPassword}
                  disabled={isLoading}
                  {...passwordForm.register('confirmPassword', { onChange: handleConfirmPasswordChange })}
                />
              )}
            </FormField>

            <div className="forgot-password-page__actions">
              <Button
                type="submit"
                loading={isLoading}
                className="forgot-password-page__submit"
              >
                Reset password
              </Button>
            </div>
          </form>
        )}

        <div className="forgot-password-page__links">
          <Link to="/login" className="forgot-password-page__link">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
