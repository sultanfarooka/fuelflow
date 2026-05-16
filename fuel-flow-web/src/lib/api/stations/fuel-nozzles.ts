/**
 * Station setup: fuel nozzles for a station.
 * GET list; POST create nozzle (linked to tank).
 * Used by station dashboard (list) and setup wizard (create on Next).
 */

import { api } from '../client'

export interface FuelNozzleDto {
  id: string
  nozzleNumber: string
  tankId: string
  tankName?: string | null
  stationId: string
  isActive: boolean
}

export interface CreateFuelNozzleRequest {
  nozzleNumber: string
  tankId: string
}

export interface FuelNozzleListApiResponse {
  success: boolean
  data: FuelNozzleDto[]
}

export interface CreateFuelNozzleApiResponse {
  success: boolean
  data: FuelNozzleDto
}

export interface DeleteFuelNozzleApiResponse {
  success: boolean
}

/**
 * Get all fuel nozzles for a station.
 * Station must belong to current user's organization.
 */
export async function getFuelNozzlesByStation(
  stationId: string
): Promise<FuelNozzleListApiResponse> {
  return api.get<FuelNozzleListApiResponse>(
    `/stations/${stationId}/fuel-nozzles`
  )
}

/**
 * Create a fuel nozzle for the station, linked to an existing tank.
 */
export async function createFuelNozzle(
  stationId: string,
  payload: CreateFuelNozzleRequest
): Promise<CreateFuelNozzleApiResponse> {
  return api.post<CreateFuelNozzleApiResponse>(
    `/stations/${stationId}/fuel-nozzles`,
    payload
  )
}

export async function deleteFuelNozzle(
  stationId: string,
  nozzleId: string
): Promise<DeleteFuelNozzleApiResponse> {
  return api.delete<DeleteFuelNozzleApiResponse>(
    `/stations/${stationId}/fuel-nozzles/${nozzleId}`
  )
}
