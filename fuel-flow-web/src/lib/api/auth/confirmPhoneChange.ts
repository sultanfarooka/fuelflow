/**
 * Phone change — step 2: confirm OTP and swap the user's phone ([M01-F09-R11]).
 */

import { api } from '../client'
import type { VerifyPhoneApiResponse } from './verifyPhone'

export interface ConfirmPhoneChangeRequest {
  newPhone: string
  code: string
}

export async function confirmPhoneChange(
  payload: ConfirmPhoneChangeRequest
): Promise<VerifyPhoneApiResponse> {
  return api.post<VerifyPhoneApiResponse>('/auth/phone/change/confirm', payload)
}
