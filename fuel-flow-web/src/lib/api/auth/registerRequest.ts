/**
 * Auth API — register, login, etc.
 */

import { api } from '../client'

export interface RegisterRequest {
  fullName: string
  /** Optional — when provided, must be a valid email; backend enforces uniqueness. */
  email?: string
  phone: string
  password: string
  deviceId?: string
}

export interface RegisterResponse {
  success: boolean
  message: string
}

/** API response wrapper for register endpoint */
export interface RegisterApiResponse {
  success: boolean
  data: RegisterResponse
}

/**
 * Register a new owner account.
 * Organization and first station are added during onboarding after first login.
 */
export async function register(
  payload: RegisterRequest
): Promise<RegisterApiResponse> {
  return api.post<RegisterApiResponse>('/auth/register', payload)
}
