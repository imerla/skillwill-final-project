import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../../shared/ui/Alert'
import { forgotPassword, verifyResetCode, resetPassword } from '../api/forgotPassword'
import { ApiErrorClass } from '../../../shared/api'
import { useLanguage, type Translations } from '../../../shared/i18n/LanguageContext'
import { useDocumentTitle } from '../../../shared/lib/useDocumentTitle'
import { EmailStep } from '../components/forgot-password/EmailStep'
import { CodeStep } from '../components/forgot-password/CodeStep'
import { NewPasswordStep } from '../components/forgot-password/NewPasswordStep'
import { translateApiData } from '../../../shared/i18n/apiTranslations'
import './ForgotPasswordPage.css'

type Step = 'email' | 'code' | 'newPassword' | 'success'
type BannerMessageKey = 'genericError' | 'networkError' | 'codeSent' | 'tooManyAttempts' | 'invalidSession' | 'resetTokenExpired'
type Banner = { variant: 'error' | 'info'; messageKey: BannerMessageKey } | null

const getBannerMessage = (key: BannerMessageKey, t: Translations): string => {
  const messages: Record<BannerMessageKey, string> = {
    genericError: t.common.genericError,
    networkError: t.common.networkError,
    codeSent: t.auth.forgot.codeSent,
    tooManyAttempts: t.auth.forgot.tooManyAttempts,
    invalidSession: t.auth.forgot.invalidSession,
    resetTokenExpired: t.auth.forgot.resetTokenExpired,
  }
  return messages[key]
}

const getMsg = (e: Record<string, string | string[]>, t: Translations): string => {
  const v = Object.values(e)[0]
  const rawMsg = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : t.common.genericError
  return translateApiData(rawMsg, t)
}

export function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)
  const [codeFieldError, setCodeFieldError] = useState<string | null>(null)
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{ newPassword?: string; confirmPassword?: string } | undefined>(undefined)
  const [tooManyAttempts, setTooManyAttempts] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState<number | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isInitialMount = useRef(true)

  useDocumentTitle(t.auth.forgot.titleEmail)

  useEffect(() => {
    if (!isInitialMount.current) headingRef.current?.focus()
    isInitialMount.current = false
  }, [step])

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer === null) return
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev === null || prev <= 1) {
          return null
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

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
      const response = await forgotPassword({ email: emailValue })
      setDevCode(response.devCode)
      setResendTimer(30)
    } catch (error) {
      // Intentionally swallow all errors except network/validation
      // Never reveal whether email exists or not
      if (error instanceof ApiErrorClass && error.status === 422 && error.errors) {
        // Only show validation errors (malformed email format)
        setBanner({ variant: 'error', messageKey: 'genericError' })
        setIsLoading(false)
        return
      }
      // For all other errors (404, 500 etc.) — still proceed to code step
      // as if the email was found, per security requirements
    } finally {
      setIsLoading(false)
    }
    // Always move to code step regardless of outcome
    setStep('code')
    setBanner({ variant: 'info', messageKey: 'codeSent' })
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
        if (error.code === 'INVALID_RESET_CODE') setCodeFieldError(t.auth.forgot.codeWrong)
        else if (error.code === 'TOO_MANY_ATTEMPTS') {
          setTooManyAttempts(true)
          setBanner({ variant: 'error', messageKey: 'tooManyAttempts' })
        } else if (error.status === 422 && error.errors) setCodeFieldError(getMsg(error.errors, t))
        else setBanner({ variant: 'error', messageKey: 'genericError' })
      } else setBanner({ variant: 'error', messageKey: 'networkError' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (isLoading || resendTimer !== null) return
    setBanner(null)
    setIsLoading(true)
    try {
      const response = await forgotPassword({ email })
      setDevCode(response.devCode)
      setResendTimer(30)
      setBanner({ variant: 'info', messageKey: 'codeSent' })
    } catch {
      setBanner({ variant: 'error', messageKey: 'genericError' })
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
        setBanner({ variant: 'error', messageKey: 'invalidSession' })
        setStep('email')
        return
      }
      await resetPassword({ resetToken, password: newPassword })
      setResetToken(null)
      setStep('success')
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        if (error.code === 'INVALID_RESET_TOKEN') {
          setResetToken(null)
          setStep('email')
          setBanner({ variant: 'error', messageKey: 'resetTokenExpired' })
        } else if (error.status === 422 && error.errors) {
          const errors: { newPassword?: string; confirmPassword?: string } = {}
          if (error.errors.newPassword) {
            const msg = typeof error.errors.newPassword === 'string' ? error.errors.newPassword : Array.isArray(error.errors.newPassword) ? error.errors.newPassword[0] : undefined
            if (msg) errors.newPassword = translateApiData(msg, t)
          }
          if (error.errors.confirmPassword) {
            const msg = typeof error.errors.confirmPassword === 'string' ? error.errors.confirmPassword : Array.isArray(error.errors.confirmPassword) ? error.errors.confirmPassword[0] : undefined
            if (msg) errors.confirmPassword = translateApiData(msg, t)
          }
          if (errors.newPassword || errors.confirmPassword) {
            setPasswordFieldErrors(errors)
          } else {
            setBanner({ variant: 'error', messageKey: 'genericError' })
          }
        } else setBanner({ variant: 'error', messageKey: 'genericError' })
      } else setBanner({ variant: 'error', messageKey: 'networkError' })
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-page__container">
          <Alert variant="success" message={t.auth.forgot.resetSuccess} className="forgot-password-page__success" />
          <div className="forgot-password-page__links">
            <Link to="/login" className="forgot-password-page__link">{t.auth.forgot.backToSignIn}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__container">
        <h1 ref={headingRef} tabIndex={-1} className="forgot-password-page__title">
          {step === 'email' && t.auth.forgot.titleEmail}
          {step === 'code' && t.auth.forgot.titleCode}
          {step === 'newPassword' && t.auth.forgot.titleNewPassword}
        </h1>
        {step === 'email' && <p className="forgot-password-page__subtitle">{t.auth.forgot.subtitleEmail}</p>}
        {step === 'code' && <p className="forgot-password-page__subtitle">{t.auth.forgot.subtitleCode(email)}</p>}
        {banner && <Alert variant={banner.variant} message={getBannerMessage(banner.messageKey, t)} className="forgot-password-page__alert" />}
        {step === 'email' && <EmailStep defaultEmail={email} isLoading={isLoading} onSubmit={submitEmail} />}
        {step === 'code' && <CodeStep isLoading={isLoading} onSubmit={submitCode} onChangeEmail={resetToEmail} onRequestNewCode={handleResendCode} tooManyAttempts={tooManyAttempts} fieldError={codeFieldError} devCode={devCode} resendTimer={resendTimer} />}
        {step === 'newPassword' && <NewPasswordStep isLoading={isLoading} onSubmit={submitNewPassword} fieldErrors={passwordFieldErrors} />}
        <div className="forgot-password-page__links">
          <Link to="/login" className="forgot-password-page__link">{t.auth.forgot.backToSignIn}</Link>
        </div>
      </div>
    </div>
  )
}

