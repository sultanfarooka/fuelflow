/**
 * Reset password using an SMS OTP from the forgot-password SMS branch.
 * See [M01-F09-R08] and [M01-F04-R04].
 */

import { api } from '../client'
import type { VerifyPhoneApiResponse } from './verifyPhone'

export interface ResetPasswordWithOtpRequest {
  phone: string
  code: string
  newPassword: string
}

export async function resetPasswordWithOtp(
  payload: ResetPasswordWithOtpRequest
): Promise<VerifyPhoneApiResponse> {
  return api.post<VerifyPhoneApiResponse>('/auth/reset-password-otp', payload)
}
