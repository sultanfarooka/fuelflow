/**
 * Re-issue the signup phone OTP. See [M01-F09-R04], [R12].
 * Enforces 60-second cooldown and daily cap on the backend.
 */

import { api } from '../client'
import type { VerifyPhoneApiResponse } from './verifyPhone'

export interface ResendOtpRequest {
  phone: string
}

export async function resendOtp(
  payload: ResendOtpRequest
): Promise<VerifyPhoneApiResponse> {
  return api.post<VerifyPhoneApiResponse>('/auth/resend-otp', payload)
}
