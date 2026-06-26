/**
 * Station setup: fuel nozzles for a station.
 * GET list; POST create; PUT update; PATCH status; DELETE.
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
  /** M08-F03: number of ShiftAssignments referencing this nozzle. */
  shiftAssignmentCount: number
}

export interface CreateFuelNozzleRequest {
  nozzleNumber: string
  tankId: string
}

/** M08-F03: PUT body. Does NOT touch IsActive — that's the PATCH /status endpoint. */
export interface UpdateFuelNozzleRequest {
  nozzleNumber: string
  tankId: string
}

/** M08-F03: PATCH /status body. */
export interface SetFuelNozzleActiveRequest {
  isActive: boolean
}

export interface SetFuelNozzleActiveResponse {
  nozzleId: string
  isActive: boolean
}

/**
 * M08-F03: DELETE success-response payload. Mirrors M08-F02's
 * DeleteFuelTankResponse. On 409 (blocked by references) the axios client
 * throws and the error carries `.response.data.references` — see
 * DeleteNozzleDialog.
 */
export interface DeleteFuelNozzleResponse {
  nozzleId: string
  blocked: boolean
  blockingReferences: string[]
}

export interface FuelNozzleListApiResponse {
  success: boolean
  data: FuelNozzleDto[]
}

export interface CreateFuelNozzleApiResponse {
  success: boolean
  data: FuelNozzleDto
}

export interface UpdateFuelNozzleApiResponse {
  success: boolean
  data: FuelNozzleDto
}

export interface SetFuelNozzleActiveApiResponse {
  success: boolean
  data: SetFuelNozzleActiveResponse
}

export interface DeleteFuelNozzleApiResponse {
  success: boolean
  data?: DeleteFuelNozzleResponse
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

/** M08-F03: Update a nozzle's number / tank assignment. */
export async function updateFuelNozzle(
  stationId: string,
  nozzleId: string,
  payload: UpdateFuelNozzleRequest
): Promise<UpdateFuelNozzleApiResponse> {
  return api.put<UpdateFuelNozzleApiResponse>(
    `/stations/${stationId}/fuel-nozzles/${nozzleId}`,
    payload
  )
}

/** M08-F03: Activate / deactivate a nozzle (soft-deactivate via the IsActive flag). */
export async function setFuelNozzleActive(
  stationId: string,
  nozzleId: string,
  payload: SetFuelNozzleActiveRequest
): Promise<SetFuelNozzleActiveApiResponse> {
  return api.patch<SetFuelNozzleActiveApiResponse>(
    `/stations/${stationId}/fuel-nozzles/${nozzleId}/status`,
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
