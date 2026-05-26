import { api } from '../client'

export interface ShiftConfigDto {
  id: string
  stationId: string
  shiftCount: 2 | 3
  shift1Name: string
  shift1StartTime: string
  shift2Name: string
  shift2StartTime: string
  shift3Name?: string | null
  shift3StartTime?: string | null
}

export interface CreateShiftConfigPayload {
  shiftCount: 2 | 3
  shift1Name: string
  shift1StartTime: string
  shift2Name: string
  shift2StartTime: string
  shift3Name?: string
  shift3StartTime?: string
}

export interface ShiftConfigApiResponse {
  success: boolean
  data: ShiftConfigDto
}

export async function createShiftConfig(
  stationId: string,
  payload: CreateShiftConfigPayload
): Promise<ShiftConfigApiResponse> {
  return api.post<ShiftConfigApiResponse>(
    `/stations/${stationId}/shift-config`,
    payload
  )
}

export async function getShiftConfig(
  stationId: string
): Promise<ShiftConfigApiResponse | null> {
  try {
    return await api.get<ShiftConfigApiResponse>(
      `/stations/${stationId}/shift-config`
    )
  } catch {
    return null
  }
}
