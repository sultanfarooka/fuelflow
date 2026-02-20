/**
 * Auth API — register, login, etc.
 */

import { api } from './api'

export interface RegisterRequest {
  fullName: string
  email: string
  phone: string
  password: string
  organizationName: string
  deviceId?: string
}

export interface RegisterResponse {
  success: boolean
  message: string
}

/**
 * Register a new owner account.
 * Creates Organization + Owner; sends verification email.
 * Strips confirmPassword from form data before sending.
 */
export async function register(
  payload: RegisterRequest & { confirmPassword?: string }
): Promise<{ success: boolean; data: RegisterResponse }> {
  const { confirmPassword: _, ...body } = payload
  return api.post<{ success: boolean; data: RegisterResponse }>(
    '/auth/register',
    body
  )
}
