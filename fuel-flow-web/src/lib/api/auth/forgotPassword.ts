/**
 * Auth API — forgot password
 */

import { api } from '../client'

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message?: string
}

export interface ForgotPasswordApiResponse {
  success: boolean
  data: ForgotPasswordResponse
}

/**
 * Request a password reset email. Returns generic success for security.
 */
export async function forgotPassword(
  payload: ForgotPasswordRequest
): Promise<ForgotPasswordApiResponse> {
  return api.post<ForgotPasswordApiResponse>('/auth/forgot-password', payload)
}
