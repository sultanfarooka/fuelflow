import { api } from '../client'

export interface DipChartEntryDto {
  id: string
  depthCm: number
  volumeLiters: number
}

export interface DipChartDto {
  id: string
  tankId: string
  entryCount: number
  entries: DipChartEntryDto[]
}

export interface UploadDipChartEntry {
  depthCm: number
  volumeLiters: number
}

export interface UploadDipChartRequest {
  entries: UploadDipChartEntry[]
}

export interface GetDipChartApiResponse {
  success: boolean
  data: DipChartDto | null
}

export interface UploadDipChartApiResponse {
  success: boolean
  data: DipChartDto
}

export async function getDipChart(
  stationId: string,
  tankId: string
): Promise<GetDipChartApiResponse> {
  return api.get<GetDipChartApiResponse>(
    `/stations/${stationId}/fuel-tanks/${tankId}/dip-chart`
  )
}

export async function uploadDipChart(
  stationId: string,
  tankId: string,
  payload: UploadDipChartRequest
): Promise<UploadDipChartApiResponse> {
  return api.post<UploadDipChartApiResponse>(
    `/stations/${stationId}/fuel-tanks/${tankId}/dip-chart`,
    payload
  )
}

