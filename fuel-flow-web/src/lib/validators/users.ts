import { z } from "zod";

/**
 * Zod schemas for user management ([M01-F05-R02], [M01-F09-R07]).
 * Mirror the backend FluentValidation rules (CreateManagerRequestValidator,
 * ActivateAccountRequestValidator) so client and server constraints agree.
 */

// Pakistani phone: +92 followed by 10 digits — mirrors validators/auth.ts.
const PHONE_REGEX = /^\+92\d{10}$/;

export const createManagerSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(PHONE_REGEX, "Phone must be in Pakistani format: +92XXXXXXXXXX"),
  email: z.string().email("Invalid email format").or(z.literal("")),
  stationIds: z.array(z.string().uuid()).min(1, "Assign at least one station"),
  requireOtp: z.boolean(),
});

export type CreateManagerFormData = z.infer<typeof createManagerSchema>;

export const activateAccountSchema = z
  .object({
    code: z
      .string()
      .min(1, "Verification code is required")
      .regex(/^\d{6}$/, "Verification code must be 6 digits"),
    newPassword: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ActivateAccountFormData = z.infer<typeof activateAccountSchema>;
