import { z } from "zod"

/**
 * [M08-F03] Mirrors `CreateFuelNozzleRequestValidator` +
 * `UpdateFuelNozzleRequestValidator` on the backend (`FuelFlow.Application.
 * Validators`). Backend is authoritative; this schema is for inline UX only.
 *
 * Rules:
 *   - NozzleNumber: trim, 1–20 chars, free text (per-station / per-tank
 *     uniqueness enforced server-side).
 *   - TankId: UUID required.
 */

const MAX_NUMBER_LENGTH = 20

export const nozzleNumberSchema = z
  .string()
  .trim()
  .min(1, "Nozzle number is required.")
  .max(MAX_NUMBER_LENGTH, `Nozzle number must not exceed ${MAX_NUMBER_LENGTH} characters.`)

export const nozzleFormSchema = z.object({
  nozzleNumber: nozzleNumberSchema,
  tankId: z.string().uuid("Pick a tank."),
})

export type NozzleFormInput = z.infer<typeof nozzleFormSchema>
