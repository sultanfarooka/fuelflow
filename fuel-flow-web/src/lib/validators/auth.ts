import { z } from 'zod'

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
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+92\d{10}$/, 'Phone must be in Pakistani format: +92XXXXXXXXXX'),
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

/** Login form schema — mirrors backend LoginRequestValidator */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

/** Forgot password form schema — email only */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

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
    .regex(/^\+92\d{10}$/, 'Phone must be in Pakistani format: +92XXXXXXXXXX')
    .or(z.literal('')),
  logoUrl: z
    .string()
    .url('Logo URL must be a valid URL')
    .max(2048, 'Logo URL must not exceed 2048 characters')
    .or(z.literal('')),
})

export type OnboardingFormData = z.input<typeof onboardingSchema>

