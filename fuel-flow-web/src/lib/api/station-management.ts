import { api } from './client'

export interface CreateStationRequest {
  name: string
  omcId: string
  address?: string
  phone?: string
  logoUrl?: string
}

export interface CreateStationResponse {
  id: string
  name: string
}

export interface CreateStationApiResponse {
  success: boolean
  data: CreateStationResponse
}

export interface OrganizationStationDto {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  logoUrl?: string | null
  isActive: boolean
  omcId: string
}

export interface StationsByOrganizationApiResponse {
  success: boolean
  data: OrganizationStationDto[]
}

/**
 * Create a new station for the current user's organization.
 * Owner/Manager only; server enforces plan limits.
 */
export async function createStation(
  payload: CreateStationRequest,
): Promise<CreateStationApiResponse> {
  return api.post<CreateStationApiResponse>('/stations', payload)
}

/**
 * Get all stations for an organization (includes OMCId).
 */
export async function getStationsByOrganization(
  organizationId: string,
): Promise<StationsByOrganizationApiResponse> {
  return api.get<StationsByOrganizationApiResponse>(`/stations/${organizationId}`)
}

