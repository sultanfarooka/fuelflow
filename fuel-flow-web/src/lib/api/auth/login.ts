/**
 * Auth API — login
 */

import { api } from '../client'

export interface LoginRequest {
  /** Pakistani phone (+92XXXXXXXXXX) or email address. Phone-first per [M01-F09-R05]. */
  identifier: string
  password: string
  deviceId?: string
}

export interface UserInfo {
  id: string
  /** Optional per [M01-F09-R01] — phone-first auth allows email-less accounts. */
  email?: string
  /** Primary identifier for phone-first auth ([M01-F09-R01]). */
  phone?: string
  fullName: string
  roles: string[]
}

export interface OrganizationInfo {
  id: string
  name: string
}

export interface StationInfo {
  id: string
  name: string
  setupComplete?: boolean
}

export interface SubscriptionInfo {
  status: string
  planId: string
  planName: string
  endsAt?: string
}

/** Auth response (login/refresh). Tokens are in HTTP-only cookies, not in JSON. */
export interface LoginResponse {
  expiresIn: number
  user: UserInfo
  organization?: OrganizationInfo | null
  subscription?: SubscriptionInfo | null
  stations?: StationInfo[] | null
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
