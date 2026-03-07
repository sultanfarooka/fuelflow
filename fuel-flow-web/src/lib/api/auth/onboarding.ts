import { api } from '../client'
import type { LoginApiResponse } from './login'

export interface OnboardingRequest {
  organizationName: string
  stationName: string
  omcId: string
  address?: string
  phone?: string
  logoUrl?: string
}

export type OnboardingApiResponse = LoginApiResponse

/**
 * Complete onboarding: create organization + first station and link to user.
 * Returns the same auth shape as login (tokens via cookies).
 */
export async function completeOnboarding(
  payload: OnboardingRequest
): Promise<OnboardingApiResponse> {
  return api.post<OnboardingApiResponse>('/onboarding', payload)
}

