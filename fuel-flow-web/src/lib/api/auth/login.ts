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

/** Auth response (login/refresh). Tokens are in HTTP-only cookies, not in JSON. */
export interface LoginResponse {
  expiresIn: number
  user: UserInfo
  subscription?: SubscriptionInfo
}

export interface SubscriptionInfo {
  status: string
  plan: string
  trialEndsAt?: string
}

export interface LoginApiResponse {
  success: boolean
  data: LoginResponse
}

/**
 * Login with email and password.
 * Returns JWT tokens and user info. Tokens should be stored by the caller.
 */
export async function login(payload: LoginRequest): Promise<LoginApiResponse> {
  return api.post<LoginApiResponse>('/auth/login', payload)
}
