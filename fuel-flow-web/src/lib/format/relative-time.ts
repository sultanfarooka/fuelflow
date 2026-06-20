/**
 * [M06-F01] Relative-time formatting for "Effective Since" cells. Uses
 * `Intl.RelativeTimeFormat` so we get correct pluralisation and Urdu
 * support for free — no external dep (no date-fns, no day.js).
 *
 * Two paired helpers:
 *   - `formatRelative(d)` — human label ("2 days ago", "just now",
 *     "in 3 hours") for the cell text.
 *   - `formatAbsoluteUtc(d)` — ISO instant ("2026-06-20T14:09:23Z") for
 *     the tooltip so a curious user can see the exact effective moment.
 */

// Lazily resolve the formatter to follow the current i18n language. Lookup
// happens once per call — Intl caches under the hood so this is cheap.
function relativeFormatter(): Intl.RelativeTimeFormat {
  // `document` may be unavailable in tests; default to `en`.
  const lang =
    (typeof document !== "undefined" && document.documentElement.lang) || "en"
  return new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "long" })
}

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
  { unit: "second", ms: 1000 },
]

/**
 * Returns the largest-unit relative phrase for `date` relative to `now`,
 * e.g. "2 days ago", "just now", "in 3 hours". Accepts a `Date` or any
 * value `new Date()` will parse (ISO string from the API).
 */
export function formatRelative(
  date: Date | string | null | undefined,
  now: Date = new Date()
): string {
  if (date == null) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ""

  const diffMs = d.getTime() - now.getTime()
  const abs = Math.abs(diffMs)
  if (abs < 45 * 1000) return "just now"

  for (const { unit, ms } of UNITS) {
    if (abs >= ms) {
      const value = Math.round(diffMs / ms)
      return relativeFormatter().format(value, unit)
    }
  }
  return "just now"
}

/** ISO-8601 UTC instant for tooltip rendering. */
export function formatAbsoluteUtc(
  date: Date | string | null | undefined
): string {
  if (date == null) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString()
}
