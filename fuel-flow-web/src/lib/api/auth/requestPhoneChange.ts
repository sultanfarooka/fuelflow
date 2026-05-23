/**
 * Phone change — step 1: request OTP for a new phone number ([M01-F09-R11]).
 */

import { api } from '../client'
import type { VerifyPhoneApiResponse } from './verifyPhone'

export interface RequestPhoneChangeRequest {
  newPhone: string
}

export async function requestPhoneChange(
  payload: RequestPhoneChangeRequest
): Promise<VerifyPhoneApiResponse> {
  return api.post<VerifyPhoneApiResponse>('/auth/phone/change/request', payload)
}
