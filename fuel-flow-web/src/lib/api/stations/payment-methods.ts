import { api } from '../client'

export interface StationDto {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  logoUrl?: string | null
  isActive: boolean
  omcId: string
  isSetupComplete: boolean
  acceptedPaymentMethods: string[]
}

export interface UpdatePaymentMethodsApiResponse {
  success: boolean
  data: StationDto
}

export const ALLOWED_PAYMENT_METHODS = [
  'Cash',
  'JazzCash',
  'Easypaisa',
  'Card / POS',
  'Bank Transfer',
] as const

export async function updatePaymentMethods(
  stationId: string,
  methods: string[]
): Promise<UpdatePaymentMethodsApiResponse> {
  return api.put<UpdatePaymentMethodsApiResponse>(
    `/stations/${stationId}/payment-methods`,
    { methods }
  )
}
