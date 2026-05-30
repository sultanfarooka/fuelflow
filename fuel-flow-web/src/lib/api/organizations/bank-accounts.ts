import { api } from '../client'

export interface BankAccountDto {
  id: string
  organizationId: string
  bankName: string
  accountNumber: string
  accountTitle: string
  isPrimary: boolean
}

export interface CreateBankAccountPayload {
  bankName: string
  accountNumber: string
  accountTitle: string
  isPrimary?: boolean
}

export interface BankAccountApiResponse {
  success: boolean
  data: BankAccountDto
}

export interface BankAccountListApiResponse {
  success: boolean
  data: BankAccountDto[]
}

export async function createBankAccount(
  orgId: string,
  payload: CreateBankAccountPayload
): Promise<BankAccountApiResponse> {
  return api.post<BankAccountApiResponse>(
    `/organizations/${orgId}/bank-accounts`,
    payload
  )
}

export async function getBankAccounts(
  orgId: string
): Promise<BankAccountListApiResponse> {
  return api.get<BankAccountListApiResponse>(
    `/organizations/${orgId}/bank-accounts`
  )
}
