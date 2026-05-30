import { api } from '../client'
import type { AxiosError } from 'axios'

export interface CompleteSetupSuccess {
  success: true
}

export interface CompleteSetupFailure {
  success: false
  unmetConditions: string[]
}

export type CompleteSetupResponse = CompleteSetupSuccess | CompleteSetupFailure

export async function completeStationSetup(
  stationId: string
): Promise<CompleteSetupResponse> {
  try {
    await api.post<{ success: true }>(`/stations/${stationId}/complete-setup`, {})
    return { success: true }
  } catch (err) {
    const axiosErr = err as AxiosError<{ unmetConditions?: string[] }>
    const unmet = axiosErr.response?.data?.unmetConditions
    if (unmet && unmet.length > 0) {
      return { success: false, unmetConditions: unmet }
    }
    throw err
  }
}
