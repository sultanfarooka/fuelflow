import { z } from 'zod'

/**
 * Registration form schema — mirrors backend RegisterRequestValidator.
 * Used for client-side validation before submit.
 * 
 * Organization is added after first login during onboarding.
 */
export const registerSchema = z.object({
  // Owner info
  fullName: z.string().min(1, 'Full name is required').max(200),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
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

/** Login form schema — mirrors backend LoginRequestValidator */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>
