import { api } from './client'

export interface OMC {
  id: string
  name: string
  email?: string | null
  address?: string | null
  phone?: string | null
}

export interface OMCListApiResponse {
  success: boolean
  data: OMC[]
}

/**
 * Get all OMCs for onboarding and station creation.
 */
export async function getOMCs(): Promise<OMCListApiResponse> {
  return api.get<OMCListApiResponse>('/omcs')
}

