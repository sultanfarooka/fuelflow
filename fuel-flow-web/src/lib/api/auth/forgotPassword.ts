/**
 * Auth API — forgot password.
 * Phone-first per [M01-F09-R08]: accepts a phone or email identifier and an
 * optional channel choice. Returns eligible channels for the user (so the UI
 * can render a chooser when both are available) and whether a code/link was
 * actually dispatched on this submission.
 */

import { api } from '../client'

export interface ForgotPasswordRequest {
  /** Phone (+92XXXXXXXXXX) or email address. */
  identifier: string
  /** Optional: "sms" or "email". Null on first submit. */
  channel?: 'sms' | 'email'
}

export interface ForgotPasswordResponse {
  success: boolean
  message?: string
  eligibleChannels: ('sms' | 'email')[]
  dispatched: boolean
  channelUsed?: 'sms' | 'email' | null
  maskedPhone?: string | null
  maskedEmail?: string | null
}

export interface ForgotPasswordApiResponse {
  success: boolean
  data: ForgotPasswordResponse
}

export async function forgotPassword(
  payload: ForgotPasswordRequest
): Promise<ForgotPasswordApiResponse> {
  return api.post<ForgotPasswordApiResponse>('/auth/forgot-password', payload)
}
