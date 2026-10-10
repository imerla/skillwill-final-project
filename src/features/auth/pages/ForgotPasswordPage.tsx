import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../../shared/ui/Alert'
import { forgotPassword, verifyResetCode, resetPassword } from '../api/forgotPassword'
import { ApiErrorClass } from '../../../shared/api'
import { ka } from '../../../shared/i18n/ka'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { EmailStep } from '../components/forgot-password/EmailStep'
import { CodeStep } from '../components/forgot-password/CodeStep'
import { NewPasswordStep } from '../components/forgot-password/NewPasswordStep'
import './ForgotPasswordPage.css'

type Step = 'email' | 'code' | 'newPassword' | 'success'
type Banner = { variant: 'error' | 'info'; message: string } | null

const getMsg = (e: Record<string, string | string[]>): string => {
  const v = Object.values(e)[0]
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : ka.common.genericError
}

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)
  const [codeFieldError, setCodeFieldError] = useState<string | null>(null)
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{ newPassword?: string } | undefined>(undefined)
  const [tooManyAttempts, setTooManyAttempts] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isInitialMount = useRef(true)

  useDocumentTitle(ka.auth.forgot.titleEmail)

  useEffect(() => {
    if (!isInitialMount.current) headingRef.current?.focus()
    isInitialMount.current = false
  }, [step])

  const resetToEmail = () => {
    setStep('email')
    setResetToken(null)
    setTooManyAttempts(false)
    setBanner(null)
    setCodeFieldError(null)
  }

  const submitEmail = async (emailValue: string) => {
    if (isLoading) return
    setBanner(null)
    setIsLoading(true)
    setEmail(emailValue)
    try {
      await forgotPassword({ email: emailValue })
      setStep('code')
      setBanner({ variant: 'info', message: ka.auth.forgot.codeSent })
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        if (error.status === 422 && error.errors) setBanner({ variant: 'error', message: getMsg(error.errors) })
        else setBanner({ variant: 'error', message: ka.common.genericError })
      } else setBanner({ variant: 'error', message: ka.common.networkError })
    } finally {
      setIsLoading(false)
    }
  }

  const submitCode = async (code: string) => {
    if (isLoading) return
    setBanner(null)
    setCodeFieldError(null)
    setIsLoading(true)
    try {
      const response = await verifyResetCode({ email, code })
      setResetToken(response.resetToken)
      setStep('newPassword')
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        if (error.code === 'INVALID_RESET_CODE') setCodeFieldError(ka.auth.forgot.codeWrong)
        else if (error.code === 'TOO_MANY_ATTEMPTS') {
          setTooManyAttempts(true)
          setBanner({ variant: 'error', message: ka.auth.forgot.tooManyAttempts })
        } else if (error.status === 422 && error.errors) setCodeFieldError(getMsg(error.errors))
        else setBanner({ variant: 'error', message: ka.common.genericError })
      } else setBanner({ variant: 'error', message: ka.common.networkError })
    } finally {
      setIsLoading(false)
    }
  }

  const submitNewPassword = async (newPassword: string) => {
    if (isLoading) return
    setBanner(null)
    setPasswordFieldErrors(undefined)
    setIsLoading(true)
    try {
      if (!resetToken) {
        setBanner({ variant: 'error', message: ka.auth.forgot.invalidSession })
        setStep('email')
        return
      }
      await resetPassword({ resetToken, newPassword })
      setResetToken(null)
      setStep('success')
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        if (error.code === 'INVALID_RESET_TOKEN') {
          setResetToken(null)
          setStep('email')
          setBanner({ variant: 'error', message: ka.auth.forgot.resetTokenExpired })
        } else if (error.status === 422 && error.errors) {
          if (error.errors.newPassword) {
            const msg = typeof error.errors.newPassword === 'string' ? error.errors.newPassword : Array.isArray(error.errors.newPassword) ? error.errors.newPassword[0] : undefined
            if (msg) setPasswordFieldErrors({ newPassword: msg })
            else setBanner({ variant: 'error', message: getMsg(error.errors) })
          } else setBanner({ variant: 'error', message: getMsg(error.errors) })
        } else setBanner({ variant: 'error', message: ka.common.genericError })
      } else setBanner({ variant: 'error', message: ka.common.networkError })
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-page__container">
          <Alert variant="success" message={ka.auth.forgot.resetSuccess} className="forgot-password-page__success" />
          <div className="forgot-password-page__links">
            <Link to="/login" className="forgot-password-page__link">{ka.auth.forgot.backToSignIn}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__container">
        <h1 ref={headingRef} tabIndex={-1} className="forgot-password-page__title">
          {step === 'email' && ka.auth.forgot.titleEmail}
          {step === 'code' && ka.auth.forgot.titleCode}
          {step === 'newPassword' && ka.auth.forgot.titleNewPassword}
        </h1>
        {step === 'email' && <p className="forgot-password-page__subtitle">{ka.auth.forgot.subtitleEmail}</p>}
        {step === 'code' && <p className="forgot-password-page__subtitle">{ka.auth.forgot.subtitleCode(email)}</p>}
        {banner && <Alert variant={banner.variant} message={banner.message} className="forgot-password-page__alert" />}
        {step === 'email' && <EmailStep defaultEmail={email} isLoading={isLoading} onSubmit={submitEmail} />}
        {step === 'code' && <CodeStep isLoading={isLoading} onSubmit={submitCode} onChangeEmail={resetToEmail} onRequestNewCode={resetToEmail} tooManyAttempts={tooManyAttempts} fieldError={codeFieldError} />}
        {step === 'newPassword' && <NewPasswordStep isLoading={isLoading} onSubmit={submitNewPassword} fieldErrors={passwordFieldErrors} />}
        <div className="forgot-password-page__links">
          <Link to="/login" className="forgot-password-page__link">{ka.auth.forgot.backToSignIn}</Link>
        </div>
      </div>
    </div>
  )
}

