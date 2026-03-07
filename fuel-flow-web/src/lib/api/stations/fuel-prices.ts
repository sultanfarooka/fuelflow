/**
 * Station setup: fuel prices for a station.
 * GET list; POST set price per fuel type.
 * Used by station dashboard (list) and setup wizard (set price on Next).
 */

import { api } from '../client'

export interface FuelPricesDto {
  id: string
  fuelTypeId: string
  fuelTypeName?: string | null
  stationId: string
  price: number
  effectiveFrom: string
  effectiveTo?: string | null
}

export interface SetFuelPriceRequest {
  fuelTypeId: string
  price: number
  effectiveFrom: string
}

export interface FuelPriceListApiResponse {
  success: boolean
  data: FuelPricesDto[]
}

export interface SetFuelPriceApiResponse {
  success: boolean
  data: FuelPricesDto
}

/**
 * Get all fuel prices for a station.
 * Station must belong to current user's organization.
 */
export async function getFuelPricesByStation(
  stationId: string
): Promise<FuelPriceListApiResponse> {
  return api.get<FuelPriceListApiResponse>(
    `/stations/${stationId}/fuel-prices`
  )
}

/**
 * Set (create or update) price for a fuel type at the station.
 * effectiveFrom is ISO date string (e.g. start of day).
 */
export async function setFuelPrice(
  stationId: string,
  payload: SetFuelPriceRequest
): Promise<SetFuelPriceApiResponse> {
  return api.post<SetFuelPriceApiResponse>(
    `/stations/${stationId}/fuel-prices`,
    payload
  )
}
