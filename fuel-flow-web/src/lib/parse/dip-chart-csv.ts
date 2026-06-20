/**
 * [M08-F02, M08-F04] Lenient dip-chart CSV parser.
 *
 * Contract (post-review revision):
 *  - **Column 1 = depth in centimetres**, **column 2 = volume in litres**.
 *    No mm→cm conversion — the value goes straight through.
 *  - No header is required and none is validated. The parser walks every
 *    line and silently skips anything that isn't two numeric columns:
 *      * blank lines
 *      * lines starting with `#` (comment convention)
 *      * lines whose first two cells aren't parseable as finite numbers
 *        (so a header row like `Depth,Volume` is dropped automatically)
 *  - The only hard error is "no rows found", returned when zero data rows
 *    were parsed.
 *
 * Returns the rows in source order plus a (possibly empty) error list.
 */

import type { UploadDipChartEntry } from "@/lib/api/stations/dip-chart"

export interface DipChartCsvParseResult {
  rows: UploadDipChartEntry[]
  errors: string[]
}

export function parseDipChartCsv(text: string): DipChartCsvParseResult {
  const rows: UploadDipChartEntry[] = []
  const lines = text.split(/\r?\n/)

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue

    const parts = line.split(",").map((p) => p.trim())
    if (parts.length < 2) continue

    const depthCm = Number(parts[0])
    const volumeLiters = Number(parts[1])
    if (!Number.isFinite(depthCm) || !Number.isFinite(volumeLiters)) continue

    rows.push({ depthCm, volumeLiters })
  }

  const errors: string[] = []
  if (rows.length === 0) {
    errors.push(
      "No data rows found. Each row needs two numbers: depth (cm), volume (litres)."
    )
  }
  return { rows, errors }
}
