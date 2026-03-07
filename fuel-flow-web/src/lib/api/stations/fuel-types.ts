/**
 * Station setup: fuel types for a station.
 * GET list (OMC-derived + custom); POST create custom type.
 * Used by station dashboard (list) and setup wizard (create on Next).
 */

import { api } from '../client'

export interface FuelTypeDto {
  id: string
  name: string
  unit: string
  isCustom: boolean
  omcId?: string | null
  source: string
}

export interface createFuelTypePayload {
  name: string
  unit: string
  omcId?: string
  isCustom: boolean
}

export interface CreateFuelTypeResponse {
  id: string
  name: string
  unit: string
  isCustom: boolean
  omcId?: string | null
}

export interface FuelTypeListApiResponse {
  success: boolean
  data: FuelTypeDto[]
}

export interface CreateFuelTypeApiResponse {
  success: boolean
  data: CreateFuelTypeResponse
}

/**
 * Get all fuel types for a station (OMC-derived + custom).
 * Station must belong to current user's organization.
 */
export async function getFuelTypesByStation(
  stationId: string
): Promise<FuelTypeListApiResponse> {
  return api.get<FuelTypeListApiResponse>(`/stations/${stationId}/fuel-types`)
}

/**
 * Create a custom fuel type for the station.
 * Returns the created type with id for use in tanks/prices.
 */
export async function createFuelType(
  stationId: string,
  payload: createFuelTypePayload
): Promise<CreateFuelTypeApiResponse> {
  return api.post<CreateFuelTypeApiResponse>(
    `/stations/${stationId}/fuel-types`,
    payload
  )
}

export interface DeleteFuelTypeApiResponse {
  success: boolean
}

/**
 * Delete a fuel type from the station.
 * Will fail if the fuel type is referenced by tanks or prices.
 */
export async function deleteFuelType(
  stationId: string,
  fuelTypeId: string
): Promise<DeleteFuelTypeApiResponse> {
  return api.delete<DeleteFuelTypeApiResponse>(
    `/stations/${stationId}/fuel-types/${fuelTypeId}`
  )
}
