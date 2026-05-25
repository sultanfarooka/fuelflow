/**
 * Verify phone OTP — called after the user receives the SMS code at signup.
 * See [M01-F09-R03].
 */

import { api } from '../client'

export interface VerifyPhoneRequest {
  phone: string
  code: string
}

export interface VerifyPhoneResponse {
  success: boolean
  message?: string
}

export interface VerifyPhoneApiResponse {
  success: boolean
  data: VerifyPhoneResponse
}

export async function verifyPhone(
  payload: VerifyPhoneRequest
): Promise<VerifyPhoneApiResponse> {
  return api.post<VerifyPhoneApiResponse>('/auth/verify-phone', payload)
}
