/**
 * Auth API — reset password
 */

import { api } from '../client'

export interface ResetPasswordRequest {
  userId: string
  token: string
  newPassword: string
}

export interface ResetPasswordResponse {
  success: boolean
  message?: string
}

export interface ResetPasswordApiResponse {
  success: boolean
  data: ResetPasswordResponse
}

/**
 * Reset password using token and userId from the reset link.
 */
export async function resetPassword(
  payload: ResetPasswordRequest
): Promise<ResetPasswordApiResponse> {
  return api.post<ResetPasswordApiResponse>('/auth/reset-password', payload)
}
