/**
 * Resend verification email API
 */

import { api } from '../client'

export interface ResendVerificationRequest {
  email: string
}

/**
 * Resend the verification email to the given address.
 */
export async function resendVerification(
  payload: ResendVerificationRequest
): Promise<void> {
  await api.post('/auth/resend-verification', payload)
}
