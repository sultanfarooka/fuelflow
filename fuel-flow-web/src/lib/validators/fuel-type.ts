import { z } from "zod"

/**
 * [M08-F08] Fuel-type name validation, mirroring the backend
 * `RenameFuelTypeRequestValidator` / `CreateFuelTypeRequestValidator`
 * (required, max 100 chars). Per-station uniqueness is dynamic and checked
 * separately against the loaded list (and authoritatively by the API).
 */
export const fuelTypeNameSchema = z
  .string()
  .trim()
  .min(1, "Fuel type name is required.")
  .max(100, "Fuel type name must not exceed 100 characters.")

export const fuelTypeUnitSchema = z.enum(["L", "kg"])
