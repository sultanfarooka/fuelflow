/**
 * [M08-F02, M08-F04] Shared dip-chart CSV parser. Extracted from the
 * onboarding wizard (`station-setup/step3-tanks.tsx` +
 * `step4-dip-charts.tsx`) so the Fuel Tanks panel is the third call site,
 * not the third copy. Future dip-chart screens import from here.
 *
 * Expected CSV shape (case-sensitive header; optional leading `#` comment):
 *
 *     # any comment line — ignored
 *     DepthMm,VolumeLiters
 *     100,250
 *     200,520
 *     …
 *
 * Depth is read in **millimetres** in the CSV and converted to **centimetres**
 * (`/10`) to match the backend's `DipChartEntry.DepthCm` column.
 */

import type { UploadDipChartEntry } from "@/lib/api/stations/dip-chart"

export interface DipChartCsvParseResult {
  rows: UploadDipChartEntry[]
  errors: string[]
}

export function parseDipChartCsv(text: string): DipChartCsvParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim())
  const rows: UploadDipChartEntry[] = []
  const errors: string[] = []

  const nonEmpty = lines.filter((l) => l.length > 0)
  if (!nonEmpty.length) return { rows, errors }

  const [first, ...rest] = nonEmpty
  const hasCommentLine = first.startsWith("#")
  const headerLine = hasCommentLine ? rest[0] : first
  const dataLines = hasCommentLine ? rest.slice(1) : rest
  const headerRowIndex = hasCommentLine ? 2 : 1

  const expectedHeader = ["DepthMm", "VolumeLiters"]
  const headerParts = headerLine?.split(",").map((p) => p.trim()) ?? []

  if (
    headerParts.length < 2 ||
    headerParts[0] !== expectedHeader[0] ||
    headerParts[1] !== expectedHeader[1]
  ) {
    errors.push(
      `Invalid header. Expected: ${expectedHeader.join(",")} (case sensitive).`
    )
    return { rows, errors }
  }

  dataLines.forEach((line, index) => {
    const parts = line.split(",").map((p) => p.trim())
    if (parts.length < 2) {
      errors.push(
        `Row ${headerRowIndex + index + 1}: expected at least 2 columns, got ${parts.length}`
      )
      return
    }
    const depthMm = Number(parts[0])
    const vol = Number(parts[1])
    if (!Number.isFinite(depthMm) || !Number.isFinite(vol)) {
      errors.push(
        `Row ${headerRowIndex + index + 1}: invalid depth or volume number`
      )
      return
    }
    rows.push({ depthCm: depthMm / 10, volumeLiters: vol })
  })

  return { rows, errors }
}
