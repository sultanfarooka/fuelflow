import { z } from 'zod'
import { ALLOWED_PAYMENT_METHODS } from '@/lib/api/stations/payment-methods'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const shiftConfigSchema = z
  .object({
    shiftCount: z.union([z.literal(2), z.literal(3)]),
    shift1Name: z.string().min(1, 'Shift 1 name is required'),
    shift1StartTime: z
      .string()
      .regex(timeRegex, 'Enter a valid time (HH:mm)'),
    shift2Name: z.string().min(1, 'Shift 2 name is required'),
    shift2StartTime: z
      .string()
      .regex(timeRegex, 'Enter a valid time (HH:mm)'),
    shift3Name: z.string().optional(),
    shift3StartTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shiftCount === 3) {
      if (!data.shift3Name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Shift 3 name is required',
          path: ['shift3Name'],
        })
      }
      if (!data.shift3StartTime || !timeRegex.test(data.shift3StartTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid time (HH:mm)',
          path: ['shift3StartTime'],
        })
      }
    }
  })

export type ShiftConfigFormData = z.infer<typeof shiftConfigSchema>

export const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountTitle: z.string().min(1, 'Account title is required'),
})

export type BankAccountFormData = z.infer<typeof bankAccountSchema>

export const inviteManagerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z
    .string()
    .regex(/^\+92\d{10}$/, 'Must be +92XXXXXXXXXX format'),
})

export type InviteManagerFormData = z.infer<typeof inviteManagerSchema>

export const paymentMethodsSchema = z
  .array(z.string())
  .min(1, 'Select at least one payment method')
  .refine((methods) => methods.includes('Cash'), {
    message: 'Cash must always be included',
  })
  .refine(
    (methods) =>
      methods.every((m) =>
        (ALLOWED_PAYMENT_METHODS as readonly string[]).includes(m)
      ),
    { message: 'One or more methods are not valid' }
  )
