import { api } from './client'

export interface OMCFuelTypeDto {
  id: string
  omcId: string
  omcName: string
  name: string
  unit: string
}

export interface OMCFuelTypeListApiResponse {
  success: boolean
  data: OMCFuelTypeDto[]
}

/**
 * Get OMC fuel types for a specific OMC.
 */
export async function getOMCFuelTypesByOmc(
  omcId: string,
): Promise<OMCFuelTypeListApiResponse> {
  const query = `?omcId=${encodeURIComponent(omcId)}`
  return api.get<OMCFuelTypeListApiResponse>(`/omc-fuel-types${query}`)
}

