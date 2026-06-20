import { z } from "zod"

/**
 * [M06-F01] Mirrors `SetFuelPriceRequestValidator` on the backend
 * (FuelFlow.Application.Validators). Keep the rules in sync — backend
 * is authoritative; the client schema is for inline UX only.
 *
 * Rules:
 *   - Price strictly positive, capped at 10,000 (sanity).
 *   - Price quoted to at most 2 decimal places (Pakistani fuel convention).
 *   - EffectiveFrom no more than 5 minutes in the past (clock-skew slop).
 */

const MAX_PRICE = 10_000
// 5-minute slop window mirrors the backend validator's clock-skew tolerance.
const PAST_SLOP_MS = 5 * 60 * 1000

export const priceSchema = z
  .number({
    invalid_type_error: "Price must be a number.",
    required_error: "Price is required.",
  })
  .gt(0, "Price must be greater than zero.")
  .lte(MAX_PRICE, `Price must not exceed ${MAX_PRICE.toLocaleString("en-PK")}.`)
  .refine((p) => Math.round(p * 100) === p * 100, {
    message: "Price may have at most two decimal places.",
  })

export const effectiveFromSchema = z
  .string()
  .min(1, "Effective date is required.")
  .refine(
    (s) => {
      const ms = new Date(s).getTime()
      if (Number.isNaN(ms)) return false
      return ms >= Date.now() - PAST_SLOP_MS
    },
    { message: "Effective date cannot be in the past." }
  )

export const setFuelPriceSchema = z.object({
  fuelTypeId: z.string().uuid("Pick a fuel type."),
  price: priceSchema,
  effectiveFrom: effectiveFromSchema,
})

export type SetFuelPriceInput = z.infer<typeof setFuelPriceSchema>
