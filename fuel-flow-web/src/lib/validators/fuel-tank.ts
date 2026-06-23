import { z } from "zod"

/**
 * [M08-F02] Mirrors `CreateFuelTankRequestValidator` +
 * `UpdateFuelTankRequestValidator` on the backend (`FuelFlow.Application.
 * Validators`). Keep the rules in sync — backend is authoritative; the
 * client schema is for inline UX only.
 *
 * Rules:
 *   - Name optional; if present trimmed and ≤ 200 chars.
 *   - Capacity strictly positive, capped at 1,000,000 L (a real fuel tank
 *     is 5,000–200,000 L — the cap leaves 5× headroom while still being
 *     a human-readable upper bound).
 *   - Fuel type UUID required.
 */

const MAX_NAME = 200
const MAX_CAPACITY = 1_000_000

export const tankNameSchema = z
  .string()
  .trim()
  .max(MAX_NAME, `Name must not exceed ${MAX_NAME} characters.`)
  .optional()
  .or(z.literal(""))

export const capacitySchema = z
  .number({
    invalid_type_error: "Capacity must be a number.",
    required_error: "Capacity is required.",
  })
  .gt(0, "Capacity must be greater than zero.")
  .lte(
    MAX_CAPACITY,
    `Capacity must not exceed ${MAX_CAPACITY.toLocaleString("en-PK")} L.`
  )

export const tankFormSchema = z.object({
  name: tankNameSchema,
  capacityLiters: capacitySchema,
  fuelTypeId: z.string().uuid("Pick a fuel type."),
})

export type TankFormInput = z.infer<typeof tankFormSchema>
