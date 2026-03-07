/**
 * Auth API — get current user
 */

import { api } from '../client'
import type { LoginResponse } from './login'

export interface MeApiResponse {
  success: boolean
  data: LoginResponse
}

/**
 * Get current authenticated user. Requires valid cookie.
 */
export async function getCurrentUser(): Promise<MeApiResponse> {
  return api.get<MeApiResponse>('/auth/me')
}
