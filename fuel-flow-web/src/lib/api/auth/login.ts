/**
 * Auth API — login
 */

import { api } from '../client'

export interface LoginRequest {
  email: string
  password: string
  deviceId?: string
}

export interface UserInfo {
  id: string
  email: string
  fullName: string
  role: string
  stations: { id: string; name: string }[]
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserInfo
  subscription?: {
    status: string
    plan: string
    trialEndsAt?: string
  }
}

export interface LoginApiResponse {
  success: boolean
  data: AuthResponse
}

/**
 * Login with email and password.
 * Returns JWT tokens and user info. Tokens should be stored by the caller.
 */
export async function login(payload: LoginRequest): Promise<LoginApiResponse> {
  return api.post<LoginApiResponse>('/auth/login', payload)
}
