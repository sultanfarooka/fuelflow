/**
 * Verify email API — called when user clicks the verification link.
 */

import { api } from '../client'

export interface VerifyEmailRequest {
  userId: string
  token: string
}

export interface VerifyEmailResponse {
  message?: string
}

/**
 * Verify email using the token and userId from the verification link.
 */
export async function verifyEmail(
  payload: VerifyEmailRequest
): Promise<VerifyEmailResponse> {
  const res = await api.post<{ success: boolean; data?: VerifyEmailResponse }>(
    '/auth/verify-email',
    payload
  )
  return res?.data ?? {}
}
