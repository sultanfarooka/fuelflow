import { api } from "../client";
import type { VerifyPhoneApiResponse } from "./verifyPhone";

/**
 * One-step account activation for an invited sub-user ([M01-F05-R02], [M01-F09-R07]):
 * verifies the signup OTP and sets the first password together. Reuses the
 * verify-phone response envelope. Resend the code via `resendOtp`.
 */
export interface ActivateAccountRequest {
  phone: string;
  code: string;
  newPassword: string;
}

export async function activateAccount(
  payload: ActivateAccountRequest,
): Promise<VerifyPhoneApiResponse> {
  return api.post<VerifyPhoneApiResponse>("/auth/activate", payload);
}
