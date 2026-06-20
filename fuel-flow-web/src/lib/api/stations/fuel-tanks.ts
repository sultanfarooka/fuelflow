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
  hasDipChart: boolean
  dipChartEntryCount: number
  /** M08-F02: number of nozzles linked to this tank. */
  nozzleCount: number
}

/**
 * M08-F02: success-response payload for DELETE. Mirrors the M08-F08 deactivate
 * shape. On 409 (blocked by references), the axios client throws and the error
 * carries `.response.data.references` — see DeleteTankDialog.
 */
export interface DeleteFuelTankResponse {
  tankId: string
  blocked: boolean
  blockingReferences: string[]
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

export interface UpdateFuelTankRequest {
  name?: string
  capacityLiters: number
  fuelTypeId: string
}

export interface UpdateFuelTankApiResponse {
  success: boolean
  data: FuelTankDto
}

export interface DeleteFuelTankApiResponse {
  success: boolean
  data?: DeleteFuelTankResponse
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

export async function updateFuelTank(
  stationId: string,
  tankId: string,
  payload: UpdateFuelTankRequest
): Promise<UpdateFuelTankApiResponse> {
  return api.put<UpdateFuelTankApiResponse>(
    `/stations/${stationId}/fuel-tanks/${tankId}`,
    payload
  )
}

export async function deleteFuelTank(
  stationId: string,
  tankId: string
): Promise<DeleteFuelTankApiResponse> {
  return api.delete<DeleteFuelTankApiResponse>(
    `/stations/${stationId}/fuel-tanks/${tankId}`
  )
}
