import { z } from 'zod'

/**
 * Normalises a Pakistani phone number to international format.
 * Converts 03XXXXXXXXX → +923XXXXXXXXX; leaves +923XXXXXXXXX unchanged.
 */
export const normalizePhone = (v: string): string => {
  const trimmed = v.trim()
  return /^0\d{10}$/.test(trimmed) ? '+92' + trimmed.slice(1) : trimmed
}

/** Zod refinement that accepts 03XXXXXXXXX or +923XXXXXXXXX after normalisation. */
const phoneField = (required = true) => {
  const base = z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().regex(/^\+92\d{10}$/, 'Enter a Pakistani phone: 03XXXXXXXXXX or +92XXXXXXXXXX'))
  return required
    ? z.string().min(1, 'Phone number is required').transform(normalizePhone).pipe(z.string().regex(/^\+92\d{10}$/, 'Enter a Pakistani phone: 03XXXXXXXXXX or +92XXXXXXXXXX'))
    : base
}

/**
 * Registration form schema — mirrors backend RegisterRequestValidator.
 * Phone-first per [M01-F09]: phone is required, email is optional.
 *
 * Organization is added after first login during onboarding.
 */
export const registerSchema = z.object({
  // Owner info
  fullName: z.string().min(1, 'Full name is required').max(200),
  // Email is optional. Empty string is allowed; if non-empty, must be a valid email.
  email: z
    .string()
    .email('Invalid email format')
    .or(z.literal('')),
  phone: phoneField(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .regex(/\d/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

/** Phone OTP verification schema — 4-8 digit code accepted; backend trims. */
export const verifyPhoneSchema = z.object({
  code: z
    .string()
    .min(1, 'Verification code is required')
    .regex(/^\d{4,8}$/, 'Verification code must be 4-8 digits'),
})

export type VerifyPhoneFormData = z.infer<typeof verifyPhoneSchema>

/** Phone change step 1 — request OTP for new phone ([M01-F09-R11]). */
export const requestPhoneChangeSchema = z.object({
  newPhone: phoneField(),
})

export type RequestPhoneChangeFormData = z.infer<typeof requestPhoneChangeSchema>

/** Phone change step 2 — confirm OTP. NewPhone is read-only in the UI; user types only the code. */
export const confirmPhoneChangeSchema = z.object({
  code: z
    .string()
    .min(1, 'Verification code is required')
    .regex(/^\d{4,8}$/, 'Verification code must be 4-8 digits'),
})

export type ConfirmPhoneChangeFormData = z.infer<typeof confirmPhoneChangeSchema>

/**
 * Login form schema — phone-or-email identifier per [M01-F09-R05].
 * Accepts a Pakistani phone (03XXXXXXXXX or +92XXXXXXXXXX) or an email address.
 */
const phoneRegex = /^\+92\d{10}$/
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Phone or email is required')
    .transform(normalizePhone)
    .pipe(
      z.string().refine((v) => phoneRegex.test(v) || emailRegex.test(v), {
        message: 'Enter your phone (03XXXXXXXXXX or +92XXXXXXXXXX) or email address',
      }),
    ),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Forgot password — phone-or-email identifier per [M01-F09-R08].
 * Re-uses the same phone/email regexes as loginSchema.
 */
export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Phone or email is required')
    .transform(normalizePhone)
    .pipe(
      z.string().refine((v) => phoneRegex.test(v) || emailRegex.test(v), {
        message: 'Enter your phone (03XXXXXXXXXX or +92XXXXXXXXXX) or email address',
      }),
    ),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

/** Reset password via SMS OTP — code + new password ([M01-F09-R08], [M01-F04-R04]). */
export const resetPasswordOtpSchema = z
  .object({
    code: z
      .string()
      .min(1, 'Verification code is required')
      .regex(/^\d{4,8}$/, 'Verification code must be 4-8 digits'),
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordOtpFormData = z.infer<typeof resetPasswordOtpSchema>

/** Reset password form schema — mirrors backend ResetPasswordRequestValidator */
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

/**
 * Onboarding form schema — mirrors OnboardingRequestValidator.
 * OrganizationName, StationName, and OMCId required; other fields optional.
 */
export const onboardingSchema = z.object({
  organizationName: z
    .string()
    .min(1, 'Organization name is required')
    .max(200, 'Organization name must not exceed 200 characters'),
  stationName: z
    .string()
    .min(1, 'Station name is required')
    .max(200, 'Station name must not exceed 200 characters'),
  omcId: z
    .string()
    .min(1, 'OMC is required')
    .uuid('Please select a valid OMC'),
  address: z
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .or(z.literal('')),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(
      z.string().regex(/^\+92\d{10}$/, 'Enter a Pakistani phone: 03XXXXXXXXXX or +92XXXXXXXXXX').or(z.literal('')),
    ),
  logoUrl: z
    .string()
    .url('Logo URL must be a valid URL')
    .max(2048, 'Logo URL must not exceed 2048 characters')
    .or(z.literal('')),
})

export type OnboardingFormData = z.input<typeof onboardingSchema>

