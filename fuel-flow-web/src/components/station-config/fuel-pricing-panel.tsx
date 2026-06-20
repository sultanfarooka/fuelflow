/**
 * [M06-F01] Fuel Pricing Management — the Fuel Pricing child route of
 * Station Configuration (M08-F07-R06). Owner + Manager can view the
 * station's current price for every fuel type, set a new price with an
 * explicit effective date, and drill into the per-fuel price history.
 *
 * Visual chrome is inherited from `ConfigPanelCard` (the M08-F08
 * extraction). Status / Sellable / activation semantics belong to the
 * Fuel Types panel and are intentionally absent here — Pricing only
 * exposes "has an active price" via the Current Price cell + the Has
 * active price faceted filter.
 */
import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  IconCoin,
  IconHistory,
  IconPencil,
  IconTag,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { ConfigPanelCard } from "@/components/station-config/config-panel-card"
import { SourceBadge } from "@/components/station-config/badges"
import { formatPkr, formatPkrPlain } from "@/lib/format/currency"
import {
  formatAbsoluteUtc,
  formatRelative,
} from "@/lib/format/relative-time"
import { setFuelPriceSchema } from "@/lib/validators/fuel-price"
import {
  getFuelPricesByStation,
  setFuelPrice,
  type FuelPricesDto,
} from "@/lib/api/stations/fuel-prices"
import {
  getFuelTypesByStation,
  type FuelTypeDto,
} from "@/lib/api/stations/fuel-types"

const FUEL_TYPES_KEY = (stationId: string) => ["stations", stationId, "fuel-types"]
const FUEL_PRICES_KEY = (stationId: string) => ["stations", stationId, "fuel-prices"]

/** Server-error helper (Axios client unwraps non-401 messages onto `.message`). */
function serverError(err: unknown, fallback: string): string {
  return (err as Error)?.message || fallback
}

/** One row in the Pricing table — fuel type joined with its current + historical prices. */
interface PricingRow {
  fuelTypeId: string
  fuelTypeName: string
  unit: string
  isCustom: boolean
  /** The single active row (`effectiveTo == null`) for this fuel type, or null. */
  currentPrice: FuelPricesDto | null
  /** Every price for this fuel type, newest first — drives the history dialog. */
  allPrices: FuelPricesDto[]
}

// ── Derived string values (used for sorting + faceted filters) ──────────────
const sourceOf = (row: PricingRow) => (row.isCustom ? "Custom" : "OMC")
const hasActivePriceOf = (row: PricingRow) => (row.currentPrice ? "Yes" : "No")

/** Faceted multi-select filter — keep the row if its value is one of the selected. */
const multiSelectFilter: FilterFn<PricingRow> = (row, columnId, value) => {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.includes(row.getValue(columnId))
}

/** "Rs 285.50" — formatted current price, or a muted "No active price" badge. */
function CurrentPriceCell({ row }: { row: PricingRow }) {
  if (!row.currentPrice) {
    return (
      <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
        No active price
      </Badge>
    )
  }
  return (
    <span className="font-medium tabular-nums text-foreground">
      {formatPkr(row.currentPrice.price)}
    </span>
  )
}

/** Relative time ("2 days ago") with absolute UTC instant in tooltip. */
function EffectiveSinceCell({ row }: { row: PricingRow }) {
  if (!row.currentPrice) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-foreground">
          {formatRelative(row.currentPrice.effectiveFrom)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {formatAbsoluteUtc(row.currentPrice.effectiveFrom)}
      </TooltipContent>
    </Tooltip>
  )
}

export function FuelPricingPanel({ stationId }: { stationId: string }) {
  const queryClient = useQueryClient()

  // Fetch fuel types + prices in parallel. The page key is per-station so
  // switching stations refetches both.
  const { data: typesData, isLoading: typesLoading, error: typesError } = useQuery({
    queryKey: FUEL_TYPES_KEY(stationId),
    queryFn: () => getFuelTypesByStation(stationId),
    enabled: !!stationId,
  })
  const fuelTypes: FuelTypeDto[] = typesData?.data ?? []

  const { data: pricesData, isLoading: pricesLoading, error: pricesError } = useQuery({
    queryKey: FUEL_PRICES_KEY(stationId),
    queryFn: () => getFuelPricesByStation(stationId),
    enabled: !!stationId,
  })
  const allPrices: FuelPricesDto[] = pricesData?.data ?? []

  // Join fuel types with their prices into one row per fuel type.
  const pricingRows = useMemo<PricingRow[]>(() => {
    const byFuelType = new Map<string, FuelPricesDto[]>()
    for (const p of allPrices) {
      const bucket = byFuelType.get(p.fuelTypeId) ?? []
      bucket.push(p)
      byFuelType.set(p.fuelTypeId, bucket)
    }
    // Sort each bucket newest-effective-first so history reads top-down.
    for (const bucket of byFuelType.values()) {
      bucket.sort(
        (a, b) =>
          new Date(b.effectiveFrom).getTime() -
          new Date(a.effectiveFrom).getTime()
      )
    }
    const nowMs = Date.now()
    return fuelTypes
      .filter((ft) => ft.isActive) // Inactive types are hidden from new pricing per M08-F08-R04
      .map((ft) => {
        const bucket = byFuelType.get(ft.id) ?? []
        // Active row at this instant: EffectiveFrom <= now < (EffectiveTo ?? +Inf).
        // We can't just use `effectiveTo == null`: a scheduled-future row also
        // has no EffectiveTo and would shadow the actually-active row.
        const current =
          bucket.find((p) => {
            const from = new Date(p.effectiveFrom).getTime()
            const to = p.effectiveTo ? new Date(p.effectiveTo).getTime() : Infinity
            return from <= nowMs && nowMs < to
          }) ?? null
        return {
          fuelTypeId: ft.id,
          fuelTypeName: ft.name,
          unit: ft.unit,
          isCustom: ft.isCustom,
          currentPrice: current,
          allPrices: bucket,
        }
      })
  }, [fuelTypes, allPrices])

  const invalidatePrices = () => {
    queryClient.invalidateQueries({ queryKey: FUEL_PRICES_KEY(stationId) })
    // The Fuel Types panel reads `hasActivePrice` for its Sellable badge —
    // invalidate it too so the M08-F08 page reflects the change.
    queryClient.invalidateQueries({ queryKey: FUEL_TYPES_KEY(stationId) })
  }

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [setTarget, setSetTarget] = useState<PricingRow | null>(null)
  const [historyTarget, setHistoryTarget] = useState<PricingRow | null>(null)

  const setMutation = useMutation({
    mutationFn: (payload: {
      fuelTypeId: string
      price: number
      effectiveFrom: string
    }) => setFuelPrice(stationId, payload),
    onSuccess: () => {
      invalidatePrices()
      toast.success("Price updated.")
      setSetTarget(null)
    },
    onError: (err) =>
      toast.error(serverError(err, "Failed to set price.")),
  })

  const handleOpenSet = (row: PricingRow) => setSetTarget(row)
  const handleOpenHistory = (row: PricingRow) => setHistoryTarget(row)

  // ── Columns ─────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<PricingRow>[]>(
    () => [
      {
        accessorKey: "fuelTypeName",
        meta: { title: "Fuel Type" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fuel Type" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.fuelTypeName}</span>
            <span className="text-xs text-muted-foreground">
              Sold per {row.original.unit}
            </span>
          </div>
        ),
      },
      {
        id: "source",
        accessorFn: sourceOf,
        meta: { title: "Source" },
        header: "Source",
        enableSorting: false,
        filterFn: multiSelectFilter,
        cell: ({ row }) => <SourceBadge isCustom={row.original.isCustom} />,
      },
      {
        id: "currentPrice",
        accessorFn: (row) => row.currentPrice?.price ?? -1,
        meta: { title: "Current Price", align: "end" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Current Price" align="end" />
        ),
        cell: ({ row }) => <CurrentPriceCell row={row.original} />,
      },
      {
        id: "effectiveSince",
        accessorFn: (row) =>
          row.currentPrice?.effectiveFrom
            ? new Date(row.currentPrice.effectiveFrom).getTime()
            : 0,
        meta: { title: "Effective Since" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Effective Since" />
        ),
        cell: ({ row }) => <EffectiveSinceCell row={row.original} />,
      },
      {
        id: "hasActivePrice",
        accessorFn: hasActivePriceOf,
        meta: { title: "Has active price" },
        header: "Active",
        enableSorting: false,
        filterFn: multiSelectFilter,
        cell: ({ row }) =>
          row.original.currentPrice ? (
            <Badge className="border-transparent bg-success/10 text-success hover:bg-success/10">
              Yes
            </Badge>
          ) : (
            <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
              No
            </Badge>
          ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenSet(row.original)}
            >
              <IconPencil className="size-4" />
              Set price
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenHistory(row.original)}
            >
              <IconHistory className="size-4" />
              History
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  // ── Mobile card (< md breakpoint) ───────────────────────────────────────
  const renderMobileCard = (row: Row<PricingRow>) => {
    const r = row.original
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-medium">{r.fuelTypeName}</span>
            <span className="text-xs text-muted-foreground">
              Sold per {r.unit}
            </span>
          </div>
          <SourceBadge isCustom={r.isCustom} />
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          {r.currentPrice ? (
            <span className="text-lg font-semibold tabular-nums">
              {formatPkr(r.currentPrice.price)}
            </span>
          ) : (
            <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
              No active price
            </Badge>
          )}
          {r.currentPrice ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(r.currentPrice.effectiveFrom)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {formatAbsoluteUtc(r.currentPrice.effectiveFrom)}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenSet(r)}
            className="flex-1"
          >
            <IconPencil className="size-4" />
            Set price
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenHistory(r)}
            className="flex-1"
          >
            <IconHistory className="size-4" />
            History
          </Button>
        </div>
      </div>
    )
  }

  const isLoading = typesLoading || pricesLoading
  const error = typesError ?? pricesError

  // ── Render ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <ConfigPanelCard
        icon={IconTag}
        title="Fuel Prices"
        description="Manage per-fuel prices for this station."
      >
        <div className="px-6 pb-6 text-sm text-destructive">
          Failed to load prices. {String(error)}
        </div>
      </ConfigPanelCard>
    )
  }

  // Station with no fuel types at all → CTA linking back to Fuel Types panel.
  if (!isLoading && fuelTypes.length === 0) {
    return (
      <ConfigPanelCard
        icon={IconTag}
        title="Fuel Prices"
        description="Manage per-fuel prices for this station."
      >
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <IconCoin className="size-10 text-muted-foreground" stroke={1.5} />
          <div className="space-y-1">
            <p className="text-sm font-medium">No fuel types yet.</p>
            <p className="text-sm text-muted-foreground">
              Add fuel types before setting prices.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link
              to="/dashboard/station/$stationId/configuration/fuel-types"
              params={{ stationId }}
            >
              Set up fuel types →
            </Link>
          </Button>
        </div>
      </ConfigPanelCard>
    )
  }

  return (
    <ConfigPanelCard
      icon={IconTag}
      title="Fuel Prices"
      description="One active price per fuel type. Setting a new price closes the previous one at the effective date you choose."
    >
      <DataTable
        columns={columns}
        data={pricingRows}
        isLoading={isLoading}
        getRowId={(r) => r.fuelTypeId}
        searchPlaceholder="Search fuel types…"
        renderMobileCard={renderMobileCard}
        initialSorting={[{ id: "fuelTypeName", desc: false }]}
        emptyState={
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No fuel types match your filters.
          </div>
        }
        filters={[
          {
            columnId: "source",
            title: "Source",
            options: [
              { label: "OMC", value: "OMC" },
              { label: "Custom", value: "Custom" },
            ],
          },
          {
            columnId: "hasActivePrice",
            title: "Has active price",
            options: [
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
            ],
          },
        ]}
      />

      <SetPriceDialog
        target={setTarget}
        isPending={setMutation.isPending}
        onOpenChange={(o) => {
          if (!o) {
            setSetTarget(null)
            setMutation.reset()
          }
        }}
        onSubmit={(price, effectiveFrom) => {
          if (!setTarget) return
          setMutation.mutate({
            fuelTypeId: setTarget.fuelTypeId,
            price,
            effectiveFrom,
          })
        }}
      />

      <PriceHistoryDialog
        target={historyTarget}
        onOpenChange={(o) => !o && setHistoryTarget(null)}
      />
    </ConfigPanelCard>
  )
}

// ── Set price dialog ────────────────────────────────────────────────────────
/**
 * Standard minimal style matching M08-F08 dialogs: no top-right X,
 * semibold title, plain right-aligned div instead of `<DialogFooter />`.
 * Pre-fills the price with the current value (or empty if none).
 *
 * Effective From is **date-only**. Prices take effect from the start of
 * the chosen day:
 *  - Today selected   → effective immediately (`now` ISO). Picking
 *    local-midnight-today would fail the backend's 5-minute past-slop
 *    validator on any clock that's already past midnight by more than
 *    5 minutes — i.e. always after the first 5 minutes of any day.
 *  - Future date      → effective at local midnight of that date,
 *    converted to UTC for the API.
 *
 * Wrapped in a `<form>` so pressing **Enter** in either input submits.
 * Cancel is `type="button"` so Space/Enter on it doesn't double-submit.
 */
function SetPriceDialog({
  target,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  target: PricingRow | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (price: number, effectiveFromIso: string) => void
}) {
  // Local form state — controlled inputs.
  const [priceStr, setPriceStr] = useState("")
  const [effectiveStr, setEffectiveStr] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Seed / reset whenever the target changes. Same effect-keyed-on-id pattern
  // as RenameFuelTypeDialog — Radix onOpenChange fires only on internal close
  // so we can't rely on it to pre-fill from an externally-set target.
  useEffect(() => {
    if (target) {
      setPriceStr(
        target.currentPrice ? formatPkrPlain(target.currentPrice.price) : ""
      )
      setEffectiveStr(toDateInputToday())
      setError(null)
    } else {
      setPriceStr("")
      setEffectiveStr("")
      setError(null)
    }
  }, [target?.fuelTypeId])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const price = Number(priceStr)
    const effectiveIso = effectiveDateToIso(effectiveStr)
    if (!effectiveIso) {
      setError("Pick an effective date.")
      return
    }
    const parsed = setFuelPriceSchema.safeParse({
      fuelTypeId: target?.fuelTypeId ?? "",
      price,
      effectiveFrom: effectiveIso,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    setError(null)
    onSubmit(parsed.data.price, parsed.data.effectiveFrom)
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-4 p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Set price for {target?.fuelTypeName}
          </DialogTitle>
          <DialogDescription>
            The current price (if any) closes at the start of the date you
            choose, and the new price becomes active.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="contents">
          <div className="grid gap-1.5">
            <Label htmlFor="set-price" className="text-sm font-semibold">
              Price (Rs / {target?.unit ?? "L"})
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                Rs
              </span>
              <Input
                id="set-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                className="w-full ps-9 tabular-nums"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="set-effective-from" className="text-sm font-semibold">
              Effective from
            </Label>
            <Input
              id="set-effective-from"
              type="date"
              min={toDateInputToday()}
              value={effectiveStr}
              onChange={(e) => setEffectiveStr(e.target.value)}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">
              Today applies immediately. A future date takes effect at the
              start of that day.
            </span>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !priceStr}>
              {isPending ? "Saving…" : "Save price"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Price history dialog ────────────────────────────────────────────────────
/**
 * Read-only modal showing every price ever set for a single fuel type,
 * newest first. Data comes from the same per-station list call as the
 * panel; we filter client-side via the row's `allPrices` field — no new
 * endpoint. The currently-active row carries the success-tone "Active"
 * badge, matching the M08-F08 Active chip.
 */
function PriceHistoryDialog({
  target,
  onOpenChange,
}: {
  target: PricingRow | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-4 p-6 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Price history — {target?.fuelTypeName}
          </DialogTitle>
          <DialogDescription>
            Every price ever set for this fuel type at this station, newest
            first.
          </DialogDescription>
        </DialogHeader>

        {target && target.allPrices.length > 0 ? (
          <div className="-mx-6 overflow-hidden border-y border-border">
            <Table>
              <TableHeader className="bg-muted/60 [&_th]:font-semibold [&_th]:text-foreground">
                <TableRow className="hover:bg-muted/60 [&_th:first-child]:ps-6 [&_th:last-child]:pe-6">
                  <TableHead className="text-end">Price</TableHead>
                  <TableHead>Effective from</TableHead>
                  <TableHead>Effective to</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:nth-child(even)]:bg-muted/30 [&_td:first-child]:ps-6 [&_td:last-child]:pe-6">
                {target.allPrices.map((p) => {
                  const isActive = p.effectiveTo == null
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-end font-medium tabular-nums">
                        {formatPkr(p.price)}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{formatRelative(p.effectiveFrom)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatAbsoluteUtc(p.effectiveFrom)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <Badge className="border-transparent bg-success/10 text-success hover:bg-success/10">
                            Active
                          </Badge>
                        ) : p.effectiveTo ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-muted-foreground">
                                {formatRelative(p.effectiveTo)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {formatAbsoluteUtc(p.effectiveTo)}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            No price history yet for this fuel type.
          </div>
        )}

        <div className="mt-2 flex justify-end">
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** "YYYY-MM-DD" for today in the user's local timezone — `<input type="date">` value. */
function toDateInputToday(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Convert a `<input type="date">` value (`YYYY-MM-DD`) to the ISO instant
 * we send to the API:
 *   - Today  → `now` (avoids the "midnight today is hours in the past"
 *              failure path through the backend's 5-min slop validator).
 *   - Future → local midnight of the chosen date, converted to UTC ISO.
 * Returns `null` for empty / unparseable input.
 */
function effectiveDateToIso(dateStr: string): string | null {
  if (!dateStr) return null
  // Compare YYYY-MM-DD lexically — same shape, identical to date equality.
  if (dateStr === toDateInputToday()) return new Date().toISOString()
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return null
  // Local midnight on the chosen calendar day; toISOString converts to UTC.
  const localMidnight = new Date(y, m - 1, d, 0, 0, 0, 0)
  if (Number.isNaN(localMidnight.getTime())) return null
  return localMidnight.toISOString()
}
