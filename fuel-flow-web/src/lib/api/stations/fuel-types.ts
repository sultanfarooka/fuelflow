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
  /** M08-F08: active/inactive for the station. */
  isActive: boolean
  /** M08-F08: number of tanks referencing this type. */
  tankCount: number
  /** M08-F08: whether a currently-effective price exists. */
  hasActivePrice: boolean
  /** M08-F08-R06: active price + ≥1 tank. */
  isSellable: boolean
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

/**
 * Rename a fuel type's display name for the station (M08-F08-R03).
 * Applies to OMC-derived and custom rows alike.
 */
export async function renameFuelType(
  stationId: string,
  fuelTypeId: string,
  payload: { name: string }
): Promise<{ success: boolean }> {
  return api.put<{ success: boolean }>(
    `/stations/${stationId}/fuel-types/${fuelTypeId}`,
    payload
  )
}

export interface SetFuelTypeActiveResponse {
  fuelTypeId: string
  isActive: boolean
  blocked: boolean
  blockingReferences: string[]
}

/**
 * Activate or deactivate a fuel type for the station (M08-F08-R04/R05).
 * Deactivation returns HTTP 409 (axios throws) when blocked by a tank or active
 * price; the error body carries `{ error, references }`.
 */
export async function setFuelTypeActive(
  stationId: string,
  fuelTypeId: string,
  payload: { isActive: boolean }
): Promise<{ success: boolean; data: SetFuelTypeActiveResponse }> {
  return api.patch<{ success: boolean; data: SetFuelTypeActiveResponse }>(
    `/stations/${stationId}/fuel-types/${fuelTypeId}/status`,
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
