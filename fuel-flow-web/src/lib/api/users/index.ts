import { api } from "../client";

/**
 * User-management endpoints (Owner only) — [M01-F05-R02].
 * Maps to the backend UsersController (`/api/v1/users`).
 */

export interface CreateManagerPayload {
  fullName: string;
  phone: string;
  email?: string;
  stationIds: string[];
  requireOtp: boolean;
}

export interface CreateManagerResult {
  userId: string;
  fullName: string;
  phone: string;
  otpRequired: boolean;
  message: string;
  /** Present only when OTP was not required — the one-time temporary password. */
  temporaryPassword?: string | null;
}

export interface ManagerStationRef {
  id: string;
  name: string;
}

export interface ManagerListItem {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  /** Doubles as the activation flag: false = invited but not yet activated. */
  phoneConfirmed: boolean;
  stations: ManagerStationRef[];
}

export interface CreateManagerApiResponse {
  success: boolean;
  data: CreateManagerResult;
}

export interface ManagerListApiResponse {
  success: boolean;
  data: ManagerListItem[];
}

export async function createManager(
  payload: CreateManagerPayload,
): Promise<CreateManagerApiResponse> {
  return api.post<CreateManagerApiResponse>("/users/managers", payload);
}

export async function getManagers(): Promise<ManagerListApiResponse> {
  return api.get<ManagerListApiResponse>("/users/managers");
}
