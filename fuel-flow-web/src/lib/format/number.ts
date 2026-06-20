/**
 * [M08-F02] Number formatting helpers. Pair to `lib/format/currency.ts` —
 * single `Intl.NumberFormat` instances declared at module top so we don't
 * rebuild per render.
 *
 * First used by the Fuel Tanks panel (capacity in litres). Reusable across
 * future modules that render bare numeric quantities (volumes, counts, %).
 */

const literFormatter = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 0,
})

/**
 * Format a litre quantity as `45,000 L`. Returns "" for null / undefined /
 * non-finite values so the caller can render a placeholder without a guard.
 */
export function formatLiters(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return ""
  return `${literFormatter.format(amount)} L`
}
