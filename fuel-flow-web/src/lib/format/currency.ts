/**
 * [M06-F01] Pakistani-Rupee currency formatting. Single shared
 * `Intl.NumberFormat` instance — declared at module top so we don't
 * rebuild it per render.
 *
 * Used first by the Fuel Pricing panel; downstream by Sales / Reports /
 * Finance once those screens land. If we ever need an alternate format
 * (e.g. integer-only on a summary card), add a second exported helper
 * here rather than inlining `Intl.NumberFormat` at the call site.
 */

const pkrFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  // Lock to 2 decimal places — matches the backend validator
  // (M06-F01 SetFuelPriceRequestValidator). Avoids "Rs 285.5" vs "Rs 285.50"
  // drift in the same table.
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Format a numeric amount as `Rs 285.50` (en-PK locale). Returns the empty
 * string when `amount` is null / undefined / not finite so the caller can
 * render a placeholder without an extra guard.
 */
export function formatPkr(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return ""
  return pkrFormatter.format(amount)
}

/** Plain-number formatter for the price `<Input>` (no Rs prefix, 2 decimals). */
const pkrPlain = new Intl.NumberFormat("en-PK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
})

/** Render `285.50` (no symbol) — for the price input's default value. */
export function formatPkrPlain(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return ""
  return pkrPlain.format(amount)
}
