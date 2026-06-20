/**
 * [M08-F02] Fuel Tanks Management — the Fuel Tanks child route of Station
 * Configuration (M08-F07-R06). Owner + Manager can add, edit, and delete
 * tanks. Each tank links to exactly one fuel type; per-station name
 * uniqueness is enforced backend-side (M02-F03-R01).
 *
 * Visual chrome is inherited from `ConfigPanelCard` — third adopter after
 * M08-F08 and M06-F01. Capacity uses `formatLiters`; nozzle count is a
 * tabular-num integer; dip-chart status is a yes/no badge (upload itself
 * is M08-F04, out of scope here — this column is read-only).
 *
 * Delete is hard-delete with a structured 409 reference-guard listing
 * attached nozzles (preflight); the EF cascade fallback path still surfaces
 * a generic error if the backend hits an unhandled FK violation.
 */
import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconBarrel,
  IconChartHistogram,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { ConfigPanelCard } from "@/components/station-config/config-panel-card"
import { SourceBadge } from "@/components/station-config/badges"
import { formatLiters } from "@/lib/format/number"
import { tankFormSchema } from "@/lib/validators/fuel-tank"
import { parseDipChartCsv } from "@/lib/parse/dip-chart-csv"
import {
  createFuelTank,
  deleteFuelTank,
  getFuelTanksByStation,
  updateFuelTank,
  type FuelTankDto,
} from "@/lib/api/stations/fuel-tanks"
import {
  getDipChart,
  uploadDipChart,
  type UploadDipChartEntry,
} from "@/lib/api/stations/dip-chart"
import {
  getFuelTypesByStation,
  type FuelTypeDto,
} from "@/lib/api/stations/fuel-types"

const FUEL_TANKS_KEY = (stationId: string) => ["stations", stationId, "fuel-tanks"]
const FUEL_TYPES_KEY = (stationId: string) => ["stations", stationId, "fuel-types"]
const DIP_CHART_KEY = (stationId: string, tankId: string) =>
  ["stations", stationId, "fuel-tanks", tankId, "dip-chart"]

/**
 * The Axios client wraps non-401 failures in a plain `Error` whose `message`
 * is the server's `{ error }` string and which carries the original
 * `response`. Same `ApiError` pattern as the M08-F08 panel.
 */
type ApiError = Error & {
  response?: { status?: number; data?: { error?: string; references?: string[] } }
}

function serverError(err: unknown, fallback: string): string {
  return (err as Error)?.message || fallback
}

// ── Derived strings (faceted filters need stable string values) ─────────────
const fuelTypeNameOf = (t: FuelTankDto) => t.fuelTypeName ?? "(unknown)"
const dipChartOf = (t: FuelTankDto) => (t.hasDipChart ? "Yes" : "No")

/** Faceted multi-select filter — keep the row if its value is in the picked set. */
const multiSelectFilter: FilterFn<FuelTankDto> = (row, columnId, value) => {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.includes(row.getValue(columnId))
}

/** Dip-chart status chip — success-tone if a chart with entries is uploaded. */
function DipChartBadge({ tank }: { tank: FuelTankDto }) {
  if (tank.hasDipChart) {
    return (
      <Badge className="border-transparent bg-success/10 text-success hover:bg-success/10">
        Yes
        {tank.dipChartEntryCount > 0 ? ` (${tank.dipChartEntryCount})` : null}
      </Badge>
    )
  }
  return (
    <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
      Not uploaded
    </Badge>
  )
}

/** Pretty fallback when a tank has no explicit name — "45,000 L tank". */
function tankLabel(t: { name?: string | null; capacityLiters: number }): string {
  return t.name && t.name.trim() ? t.name : `${formatLiters(t.capacityLiters)} tank`
}

export function FuelTanksPanel({ stationId }: { stationId: string }) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: FUEL_TANKS_KEY(stationId),
    queryFn: () => getFuelTanksByStation(stationId),
    enabled: !!stationId,
  })
  const tanks: FuelTankDto[] = data?.data ?? []

  // Active fuel types are needed for the Add / Edit dialogs' Fuel Type select.
  // Inactive types are hidden from new-tank pickers per M08-F08-R04.
  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: FUEL_TYPES_KEY(stationId),
    queryFn: () => getFuelTypesByStation(stationId),
    enabled: !!stationId,
  })
  const allFuelTypes: FuelTypeDto[] = typesData?.data ?? []
  const activeFuelTypes = useMemo(
    () => allFuelTypes.filter((ft) => ft.isActive),
    [allFuelTypes]
  )

  const invalidateTanks = () => {
    queryClient.invalidateQueries({ queryKey: FUEL_TANKS_KEY(stationId) })
    // M08-F08 Sellable badge depends on tankCount — invalidate so it flips.
    queryClient.invalidateQueries({ queryKey: FUEL_TYPES_KEY(stationId) })
  }

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FuelTankDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FuelTankDto | null>(null)
  const [blockReferences, setBlockReferences] = useState<string[] | null>(null)
  const [dipChartTarget, setDipChartTarget] = useState<FuelTankDto | null>(null)

  /**
   * Add-tank chains create → optional dip-chart upload. The dip chart isn't
   * a tank column on the backend (it's a separate `…/dip-chart` POST), so we
   * sequence the two requests here. If the dip-chart upload fails, the tank
   * still exists — surface that as a partial-success warning so the user
   * knows to retry from the row's "Dip chart" action.
   */
  const createMutation = useMutation({
    mutationFn: async (payload: {
      name?: string
      capacityLiters: number
      fuelTypeId: string
      dipChartEntries?: UploadDipChartEntry[]
    }) => {
      const created = await createFuelTank(stationId, {
        name: payload.name,
        capacityLiters: payload.capacityLiters,
        fuelTypeId: payload.fuelTypeId,
      })
      const tankId = created.data.id
      if (payload.dipChartEntries && payload.dipChartEntries.length > 0) {
        try {
          await uploadDipChart(stationId, tankId, {
            entries: payload.dipChartEntries,
          })
          return { created, dipChartUploaded: true as const }
        } catch (err) {
          // Tank was created; only the chart upload failed. Bubble a structured
          // shape so onSuccess can warn the user without losing the new tank.
          return {
            created,
            dipChartUploaded: false as const,
            dipChartError: serverError(err, "Dip chart upload failed."),
          }
        }
      }
      return { created, dipChartUploaded: undefined }
    },
    onSuccess: (result) => {
      invalidateTanks()
      if (result.dipChartUploaded === true) {
        toast.success("Tank added with dip chart.")
      } else if (result.dipChartUploaded === false) {
        toast.warning(
          `Tank added — but dip chart upload failed: ${result.dipChartError ?? ""}. Use the Dip chart action to retry.`
        )
      } else {
        toast.success("Tank added.")
      }
      setAddOpen(false)
    },
    onError: (err) => toast.error(serverError(err, "Failed to add tank.")),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      tankId,
      payload,
    }: {
      tankId: string
      payload: { name?: string; capacityLiters: number; fuelTypeId: string }
    }) => updateFuelTank(stationId, tankId, payload),
    onSuccess: () => {
      invalidateTanks()
      toast.success("Tank updated.")
      setEditTarget(null)
    },
    onError: (err) => toast.error(serverError(err, "Failed to update tank.")),
  })

  const deleteMutation = useMutation({
    mutationFn: (tankId: string) => deleteFuelTank(stationId, tankId),
    onSuccess: (res) => {
      // 409 throws into onError; this path is always a clean success — but the
      // backend's preflight can still return success+blocked, so check that
      // shape and route into onError-equivalent UX.
      if (res.data?.blocked) {
        setBlockReferences(res.data.blockingReferences ?? ["existing references"])
        return
      }
      invalidateTanks()
      toast.success("Tank deleted.")
      setDeleteTarget(null)
    },
    onError: (err) => {
      const ae = err as ApiError
      if (ae.response?.status === 409) {
        setBlockReferences(ae.response.data?.references ?? ["existing references"])
        return
      }
      toast.error(serverError(err, "Failed to delete tank."))
      setDeleteTarget(null)
    },
  })

  const handleOpenAdd = () => setAddOpen(true)
  const handleOpenEdit = (tank: FuelTankDto) => setEditTarget(tank)
  const handleOpenDipChart = (tank: FuelTankDto) => setDipChartTarget(tank)
  const handleOpenDelete = (tank: FuelTankDto) => {
    setBlockReferences(null)
    setDeleteTarget(tank)
  }

  // ── Columns ─────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<FuelTankDto>[]>(
    () => [
      {
        accessorKey: "name",
        meta: { title: "Name" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{tankLabel(row.original)}</span>
            {row.original.name ? (
              <span className="text-xs text-muted-foreground">
                {formatLiters(row.original.capacityLiters)}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "capacityLiters",
        meta: { title: "Capacity", align: "end" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Capacity" align="end" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatLiters(row.original.capacityLiters)}
          </span>
        ),
      },
      {
        id: "fuelType",
        accessorFn: fuelTypeNameOf,
        meta: { title: "Fuel type" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fuel type" />
        ),
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const ft = allFuelTypes.find((f) => f.id === row.original.fuelTypeId)
          return (
            <div className="flex items-center gap-2">
              <span>{row.original.fuelTypeName ?? "(unknown)"}</span>
              {ft ? <SourceBadge isCustom={ft.isCustom} /> : null}
            </div>
          )
        },
      },
      {
        id: "dipChart",
        accessorFn: dipChartOf,
        meta: { title: "Dip chart" },
        header: "Dip chart",
        enableSorting: false,
        filterFn: multiSelectFilter,
        cell: ({ row }) => <DipChartBadge tank={row.original} />,
      },
      {
        accessorKey: "nozzleCount",
        meta: { title: "Nozzles", align: "end" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nozzles" align="end" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.nozzleCount}</span>
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
              onClick={() => handleOpenEdit(row.original)}
            >
              <IconPencil className="size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenDipChart(row.original)}
            >
              <IconChartHistogram className="size-4" />
              Dip chart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenDelete(row.original)}
            >
              <IconTrash className="size-4" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [allFuelTypes]
  )

  // ── Mobile card (< md breakpoint) ───────────────────────────────────────
  const renderMobileCard = (row: Row<FuelTankDto>) => {
    const t = row.original
    const ft = allFuelTypes.find((f) => f.id === t.fuelTypeId)
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-medium">{tankLabel(t)}</span>
            {t.fuelTypeName ? (
              <span className="text-xs text-muted-foreground">
                {t.fuelTypeName}
              </span>
            ) : null}
          </div>
          {ft ? <SourceBadge isCustom={ft.isCustom} /> : null}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums">
            {formatLiters(t.capacityLiters)}
          </span>
          <span className="text-xs text-muted-foreground">
            · {t.nozzleCount} {t.nozzleCount === 1 ? "nozzle" : "nozzles"}
          </span>
        </div>

        <div className="mt-2">
          <DipChartBadge tank={t} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(t)}
            className="flex-1"
          >
            <IconPencil className="size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDipChart(t)}
            className="flex-1"
          >
            <IconChartHistogram className="size-4" />
            Dip chart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDelete(t)}
            className="flex-1"
          >
            <IconTrash className="size-4" />
            Delete
          </Button>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <ConfigPanelCard
        icon={IconBarrel}
        title="Fuel Tanks"
        description="Manage the storage tanks at this station."
      >
        <div className="px-6 pb-6 text-sm text-destructive">
          Failed to load tanks. {String(error)}
        </div>
      </ConfigPanelCard>
    )
  }

  // Station with no fuel types at all → CTA back to Fuel Types panel; hide Add.
  if (!isLoading && !typesLoading && allFuelTypes.length === 0) {
    return (
      <ConfigPanelCard
        icon={IconBarrel}
        title="Fuel Tanks"
        description="Manage the storage tanks at this station."
      >
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <IconBarrel className="size-10 text-muted-foreground" stroke={1.5} />
          <div className="space-y-1">
            <p className="text-sm font-medium">No fuel types yet.</p>
            <p className="text-sm text-muted-foreground">
              Add fuel types before adding tanks.
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
      icon={IconBarrel}
      title="Fuel Tanks"
      description="Each tank holds exactly one fuel type. Set the capacity in litres."
      action={
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto">
          <IconPlus className="size-4" />
          Add tank
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={tanks}
        isLoading={isLoading}
        getRowId={(t) => t.id}
        searchPlaceholder="Search tanks…"
        renderMobileCard={renderMobileCard}
        initialSorting={[{ id: "name", desc: false }]}
        emptyState={
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No tanks yet. Add one to get started.
          </div>
        }
        filters={[
          {
            columnId: "fuelType",
            title: "Fuel type",
            options: Array.from(
              new Set(tanks.map((t) => t.fuelTypeName ?? "(unknown)"))
            ).map((name) => ({ label: name, value: name })),
          },
          {
            columnId: "dipChart",
            title: "Dip chart",
            options: [
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
            ],
          },
        ]}
      />

      <TankFormDialog
        mode="add"
        open={addOpen}
        target={null}
        fuelTypes={activeFuelTypes}
        isPending={createMutation.isPending}
        existingNames={tanks.map((t) => t.name ?? "")}
        onOpenChange={(o) => {
          if (!o) {
            setAddOpen(false)
            createMutation.reset()
          }
        }}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      <TankFormDialog
        mode="edit"
        open={!!editTarget}
        target={editTarget}
        fuelTypes={activeFuelTypes}
        isPending={updateMutation.isPending}
        existingNames={tanks
          .filter((t) => t.id !== editTarget?.id)
          .map((t) => t.name ?? "")}
        onOpenChange={(o) => {
          if (!o) {
            setEditTarget(null)
            updateMutation.reset()
          }
        }}
        onSubmit={(payload) => {
          if (!editTarget) return
          updateMutation.mutate({ tankId: editTarget.id, payload })
        }}
      />

      <DeleteTankDialog
        target={deleteTarget}
        references={blockReferences}
        isPending={deleteMutation.isPending}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTarget(null)
            setBlockReferences(null)
            deleteMutation.reset()
          }
        }}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMutation.mutate(deleteTarget.id)
        }}
      />

      <DipChartDialog
        stationId={stationId}
        target={dipChartTarget}
        onOpenChange={(o) => !o && setDipChartTarget(null)}
        onUploaded={() => {
          // Tanks query carries hasDipChart + dipChartEntryCount; refetch so
          // the chip in the table updates immediately.
          queryClient.invalidateQueries({ queryKey: FUEL_TANKS_KEY(stationId) })
        }}
      />
    </ConfigPanelCard>
  )
}

// ── Add / Edit dialog (shared shell) ────────────────────────────────────────
/**
 * One dialog component, two `mode`s. Add starts blank; Edit pre-fills from
 * `target`. When the Edit dialog detects the user is changing the fuel type
 * (`pickedFuelTypeId !== target.fuelTypeId`), it renders a destructive-tone
 * warning Alert and requires a **second** click on Save — Save shows
 * "Tap again to confirm" on the first click and only fires the mutation on
 * the second. Add never asks for that extra confirmation.
 *
 * Wrapped in `<form onSubmit>` so Enter submits.
 */
function TankFormDialog({
  mode,
  open,
  target,
  fuelTypes,
  isPending,
  existingNames,
  onOpenChange,
  onSubmit,
}: {
  mode: "add" | "edit"
  open: boolean
  target: FuelTankDto | null
  fuelTypes: FuelTypeDto[]
  isPending: boolean
  existingNames: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: {
    name?: string
    capacityLiters: number
    fuelTypeId: string
    dipChartEntries?: UploadDipChartEntry[]
  }) => void
}) {
  const [name, setName] = useState("")
  const [capacityStr, setCapacityStr] = useState("")
  const [fuelTypeId, setFuelTypeId] = useState<string>("")
  const [confirmedReassign, setConfirmedReassign] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Optional dip-chart upload (Add mode only). Edit-mode users go through the
  // dedicated Dip chart action button on the row.
  const [dipFileName, setDipFileName] = useState<string>("")
  const [dipEntries, setDipEntries] = useState<UploadDipChartEntry[]>([])
  const [dipErrors, setDipErrors] = useState<string[]>([])

  // Pre-fill on each open. For Add, the deps are stable (mode="add" only fires
  // when `open` toggles); for Edit, key on the target's id.
  useEffect(() => {
    if (!open) {
      setName("")
      setCapacityStr("")
      setFuelTypeId("")
      setConfirmedReassign(false)
      setError(null)
      setDipFileName("")
      setDipEntries([])
      setDipErrors([])
      return
    }
    if (mode === "edit" && target) {
      setName(target.name ?? "")
      setCapacityStr(String(target.capacityLiters))
      setFuelTypeId(target.fuelTypeId)
    } else {
      setName("")
      setCapacityStr("")
      setFuelTypeId(fuelTypes[0]?.id ?? "")
    }
    setConfirmedReassign(false)
    setError(null)
    setDipFileName("")
    setDipEntries([])
    setDipErrors([])
  }, [open, mode, target?.id, fuelTypes])

  const isReassign = mode === "edit" && !!target && fuelTypeId !== target.fuelTypeId
  const trimmedName = name.trim()
  const existingNameSet = new Set(
    existingNames.filter(Boolean).map((n) => n.toLowerCase())
  )

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const capacity = Number(capacityStr)
    const parsed = tankFormSchema.safeParse({
      name: trimmedName ? trimmedName : undefined,
      capacityLiters: capacity,
      fuelTypeId,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    if (trimmedName && existingNameSet.has(trimmedName.toLowerCase())) {
      setError("A tank with this name already exists at this station.")
      return
    }
    if (isReassign && !confirmedReassign) {
      setConfirmedReassign(true)
      setError(null)
      return
    }
    if (mode === "add" && dipErrors.length > 0) {
      setError("Fix the dip-chart CSV before saving.")
      return
    }
    setError(null)
    onSubmit({
      name: trimmedName ? trimmedName : undefined,
      capacityLiters: parsed.data.capacityLiters,
      fuelTypeId: parsed.data.fuelTypeId,
      dipChartEntries:
        mode === "add" && dipEntries.length > 0 ? dipEntries : undefined,
    })
  }

  const handleDipFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setDipFileName("")
      setDipEntries([])
      setDipErrors([])
      return
    }
    setDipFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const { rows, errors } = parseDipChartCsv(text)
      setDipEntries(rows)
      setDipErrors(errors)
    }
    reader.onerror = () => {
      setDipEntries([])
      setDipErrors(["Failed to read CSV file."])
    }
    reader.readAsText(file)
  }

  const titleText = mode === "add" ? "Add tank" : `Edit ${tankLabel(target ?? { capacityLiters: 0 })}`
  const saveLabel =
    isPending
      ? mode === "add" ? "Adding…" : "Saving…"
      : isReassign && !confirmedReassign
      ? "Tap again to confirm"
      : mode === "add"
      ? "Add tank"
      : "Save"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-4 p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {titleText}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Each tank holds one fuel type. Name is optional."
              : "Update name, capacity, or fuel type. Reassigning the fuel type asks for an extra confirmation."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="contents">
          <div className="grid gap-1.5">
            <Label htmlFor="tank-name" className="text-sm font-semibold">
              Name <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="tank-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tank 1"
              className="w-full"
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tank-capacity" className="text-sm font-semibold">
              Capacity (L)
            </Label>
            <Input
              id="tank-capacity"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={capacityStr}
              onChange={(e) => setCapacityStr(e.target.value)}
              placeholder="45000"
              className="w-full tabular-nums"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tank-fueltype" className="text-sm font-semibold">
              Fuel type
            </Label>
            <Select
              value={fuelTypeId}
              onValueChange={(v) => {
                setFuelTypeId(v)
                setConfirmedReassign(false)
              }}
            >
              <SelectTrigger id="tank-fueltype" className="w-full">
                <SelectValue placeholder="Pick a fuel type" />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((ft) => (
                  <SelectItem key={ft.id} value={ft.id}>
                    {ft.name} ({ft.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "add" && (
            <div className="grid gap-1.5">
              <Label htmlFor="tank-dip-csv" className="text-sm font-semibold">
                Dip chart CSV <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="tank-dip-csv"
                type="file"
                accept=".csv,text/csv"
                onChange={handleDipFile}
                className="w-full file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
              />
              <span className="text-xs text-muted-foreground">
                Two columns: <code>DepthMm,VolumeLiters</code>. Optional first
                line starting with <code>#</code> is treated as a comment.
                Upload later from the row's Dip chart action if you skip now.
              </span>
              {dipFileName && dipErrors.length === 0 && dipEntries.length > 0 && (
                <span className="text-xs text-success">
                  Parsed {dipEntries.length}{" "}
                  {dipEntries.length === 1 ? "entry" : "entries"} from{" "}
                  {dipFileName}.
                </span>
              )}
              {dipErrors.length > 0 && (
                <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
                  <IconAlertTriangle className="size-4" />
                  <AlertDescription>
                    <ul className="list-inside list-disc">
                      {dipErrors.slice(0, 3).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {dipErrors.length > 3 ? (
                        <li>…and {dipErrors.length - 3} more.</li>
                      ) : null}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {isReassign && (
            <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
              <IconAlertTriangle className="size-4" />
              <AlertDescription>
                Changing the fuel type of this tank. Historical readings and
                attached nozzles will keep their old fuel-type assignment for
                reports.
                {confirmedReassign ? null : " Tap Save again to confirm."}
              </AlertDescription>
            </Alert>
          )}

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
            <Button
              type="submit"
              disabled={isPending || !capacityStr || !fuelTypeId}
              variant={isReassign && !confirmedReassign ? "destructive" : "default"}
            >
              {saveLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete confirm dialog (shows 409 references) ────────────────────────────
/**
 * Standard minimal confirm. Same shape as M08-F08's DeactivateDialog: when
 * the server returns 409 (or success+Blocked), the dialog stays open with
 * a destructive Alert listing the blocking references, and the Delete
 * button is replaced with Close.
 */
function DeleteTankDialog({
  target,
  references,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  target: FuelTankDto | null
  references: string[] | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const blocked = references !== null && references.length > 0
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-4 p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Delete {target ? tankLabel(target) : "tank"}?
          </DialogTitle>
          <DialogDescription>
            This permanently removes the tank from this station. Stored readings
            (if any) keep their reference; nozzles must be moved or removed first.
          </DialogDescription>
        </DialogHeader>

        {blocked && (
          <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
            <IconAlertTriangle className="size-4" />
            <AlertDescription>
              Can&apos;t delete — still in use by {references!.join(" and ")}.
              Remove those first.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {blocked ? "Close" : "Cancel"}
            </Button>
          </DialogClose>
          {!blocked && (
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete tank"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Dip chart dialog (view + replace) ───────────────────────────────────────
/**
 * Per-tank dip-chart manager. Lazy-loads the current chart on open (the
 * panel's list query doesn't carry the full entries, just `hasDipChart` +
 * `dipChartEntryCount`). Renders:
 *  - A summary line + collapsible table of the existing entries (or
 *    "Not uploaded" if none).
 *  - A CSV file input + parsed-preview / errors.
 *  - A single Save button that POSTs `…/dip-chart` — the backend handler
 *    is upsert (deletes the prior chart first), so this is also the
 *    "replace" path.
 */
function DipChartDialog({
  stationId,
  target,
  onOpenChange,
  onUploaded,
}: {
  stationId: string
  target: FuelTankDto | null
  onOpenChange: (open: boolean) => void
  onUploaded: () => void
}) {
  const queryClient = useQueryClient()
  const open = !!target

  const { data, isLoading, error } = useQuery({
    queryKey: target ? DIP_CHART_KEY(stationId, target.id) : ["dip-chart", "noop"],
    queryFn: () => getDipChart(stationId, target!.id),
    enabled: open && !!target,
  })
  const chart = data?.data ?? null

  const [fileName, setFileName] = useState<string>("")
  const [entries, setEntries] = useState<UploadDipChartEntry[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!open) {
      setFileName("")
      setEntries([])
      setParseErrors([])
      setShowAll(false)
    }
  }, [open])

  const uploadMutation = useMutation({
    mutationFn: (payload: { entries: UploadDipChartEntry[] }) =>
      uploadDipChart(stationId, target!.id, payload),
    onSuccess: () => {
      if (target) {
        queryClient.invalidateQueries({
          queryKey: DIP_CHART_KEY(stationId, target.id),
        })
      }
      onUploaded()
      toast.success("Dip chart updated.")
      onOpenChange(false)
    },
    onError: (err) => toast.error(serverError(err, "Failed to upload dip chart.")),
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setFileName("")
      setEntries([])
      setParseErrors([])
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const { rows, errors } = parseDipChartCsv(text)
      setEntries(rows)
      setParseErrors(errors)
    }
    reader.onerror = () => {
      setEntries([])
      setParseErrors(["Failed to read CSV file."])
    }
    reader.readAsText(file)
  }

  const canSave = entries.length > 0 && parseErrors.length === 0
  const existingEntries = chart?.entries ?? []
  const visibleEntries = showAll ? existingEntries : existingEntries.slice(0, 8)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-4 p-6 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Dip chart — {target ? tankLabel(target) : "tank"}
          </DialogTitle>
          <DialogDescription>
            Depth-to-volume table for this tank. Uploading a new CSV replaces
            the existing chart.
          </DialogDescription>
        </DialogHeader>

        {/* Current chart */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Current chart</div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive">
              Failed to load dip chart.
            </p>
          ) : existingEntries.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              No dip chart uploaded yet.
            </p>
          ) : (
            <div className="-mx-6 overflow-hidden border-y border-border">
              <Table>
                <TableHeader className="bg-muted/60 [&_th]:font-semibold [&_th]:text-foreground">
                  <TableRow className="hover:bg-muted/60 [&_th:first-child]:ps-6 [&_th:last-child]:pe-6">
                    <TableHead className="text-end">Depth (cm)</TableHead>
                    <TableHead className="text-end">Volume (L)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:nth-child(even)]:bg-muted/30 [&_td:first-child]:ps-6 [&_td:last-child]:pe-6">
                  {visibleEntries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-end tabular-nums">
                        {e.depthCm}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {e.volumeLiters}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {existingEntries.length > 8 && (
                <div className="px-6 py-2 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll((s) => !s)}
                  >
                    {showAll
                      ? "Show fewer"
                      : `Show all ${existingEntries.length} entries`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Replace / upload */}
        <div className="grid gap-1.5">
          <Label htmlFor="dip-replace-csv" className="text-sm font-semibold">
            {existingEntries.length > 0 ? "Replace with CSV" : "Upload CSV"}
          </Label>
          <Input
            id="dip-replace-csv"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="w-full file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
          />
          <span className="text-xs text-muted-foreground">
            Two columns: <code>DepthMm,VolumeLiters</code>. Optional first
            line starting with <code>#</code> is treated as a comment.
          </span>
          {fileName && parseErrors.length === 0 && entries.length > 0 && (
            <span className="text-xs text-success">
              Parsed {entries.length}{" "}
              {entries.length === 1 ? "entry" : "entries"} from {fileName}.
            </span>
          )}
          {parseErrors.length > 0 && (
            <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
              <IconAlertTriangle className="size-4" />
              <AlertDescription>
                <ul className="list-inside list-disc">
                  {parseErrors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {parseErrors.length > 3 ? (
                    <li>…and {parseErrors.length - 3} more.</li>
                  ) : null}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => uploadMutation.mutate({ entries })}
            disabled={!canSave || uploadMutation.isPending}
          >
            {uploadMutation.isPending
              ? "Uploading…"
              : existingEntries.length > 0
              ? "Replace dip chart"
              : "Upload dip chart"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
