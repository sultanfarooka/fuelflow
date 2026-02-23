/**
 * Auth API — get current user
 */

import { api } from '../client'
import type { UserInfo } from './login'

export interface MeApiResponse {
  success: boolean
  data: {
    user: UserInfo
    subscription?: { status: string; plan: string; trialEndsAt?: string }
    expiresIn: number
  }
}

/**
 * Get current authenticated user. Requires valid cookie.
 */
export async function getCurrentUser(): Promise<MeApiResponse> {
  return api.get<MeApiResponse>('/auth/me')
}
