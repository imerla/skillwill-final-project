import { api } from '../../../shared/api'

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyResetCodeRequest {
  email: string
  code: string
}

export interface VerifyResetCodeResponse {
  resetToken: string
}

export interface ResetPasswordRequest {
  resetToken: string
  newPassword: string
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<void> {
  return api.post<void>('/auth/forgot-password', data)
}

export async function verifyResetCode(data: VerifyResetCodeRequest): Promise<VerifyResetCodeResponse> {
  return api.post<VerifyResetCodeResponse>('/auth/verify-reset-code', data)
}

export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  return api.post<void>('/auth/reset-password', data)
}

