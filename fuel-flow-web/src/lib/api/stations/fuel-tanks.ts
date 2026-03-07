/**
 * Station setup: fuel tanks for a station.
 * GET list; POST create tank.
 * Used by station dashboard (list) and setup wizard (create on Next).
 */

import { api } from '../client'

export interface FuelTankDto {
  id: string
  name?: string | null
  capacityLiters: number
  fuelTypeId: string
  fuelTypeName?: string | null
}

export interface CreateFuelTankRequest {
  name?: string
  capacityLiters: number
  fuelTypeId: string
}

export interface CreateFuelTankResponse {
  id: string
  name?: string | null
  capacityLiters: number
  fuelTypeId: string
  fuelTypeName?: string | null
}

export interface FuelTankListApiResponse {
  success: boolean
  data: FuelTankDto[]
}

export interface CreateFuelTankApiResponse {
  success: boolean
  data: CreateFuelTankResponse
}

/**
 * Get all fuel tanks for a station.
 * Station must belong to current user's organization.
 */
export async function getFuelTanksByStation(
  stationId: string
): Promise<FuelTankListApiResponse> {
  return api.get<FuelTankListApiResponse>(`/stations/${stationId}/fuel-tanks`)
}

/**
 * Create a fuel tank for the station.
 * Returns the created tank with id for use in nozzles.
 */
export async function createFuelTank(
  stationId: string,
  payload: CreateFuelTankRequest
): Promise<CreateFuelTankApiResponse> {
  return api.post<CreateFuelTankApiResponse>(
    `/stations/${stationId}/fuel-tanks`,
    payload
  )
}
