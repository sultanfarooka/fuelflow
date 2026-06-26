/**
 * [M08-F03] Fuel Nozzles Management — the Nozzles child route of Station
 * Configuration (M08-F07-R06). Owner + Manager can add a nozzle (number +
 * tank required), edit number / linked tank, toggle Active / Inactive, and
 * delete with a structured 409 reference-guard listing blocking shift
 * assignments. Fourth adopter of `ConfigPanelCard` + `DataTable` + the
 * extracted badges + `<ActiveToggle>` (after M08-F08, M06-F01, M08-F02).
 *
 * Per-station nozzle-number uniqueness is enforced server-side (M08-F03-R02).
 * Note: the existing Create handler scopes uniqueness per-(stationId, tankId,
 * nozzleNumber); the new Update handler matches that scope for consistency
 * with Create — see the M08-F03 implementation notes for the R02 mismatch
 * discussion.
 *
 * No `formatLiters` / `formatPkr` here — nozzles carry no numeric payload of
 * their own; the tank's capacity / fuel-type metadata is rendered as
 * secondary context only.
 */
import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconGasStation,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { ActiveToggle } from "@/components/station-config/active-toggle"
import { ConfigPanelCard } from "@/components/station-config/config-panel-card"
import { StatusBadge } from "@/components/station-config/badges"
import { nozzleFormSchema } from "@/lib/validators/fuel-nozzle"
import {
  createFuelNozzle,
  deleteFuelNozzle,
  getFuelNozzlesByStation,
  setFuelNozzleActive,
  updateFuelNozzle,
  type FuelNozzleDto,
} from "@/lib/api/stations/fuel-nozzles"
import {
  getFuelTanksByStation,
  type FuelTankDto,
} from "@/lib/api/stations/fuel-tanks"

const FUEL_NOZZLES_KEY = (stationId: string) =>
  ["stations", stationId, "fuel-nozzles"]
const FUEL_TANKS_KEY = (stationId: string) =>
  ["stations", stationId, "fuel-tanks"]
const FUEL_TYPES_KEY = (stationId: string) =>
  ["stations", stationId, "fuel-types"]

/** Axios client unwraps non-401 failures into `Error.message`; status + 409
 *  payload travel on the `response` field. Same pattern as M08-F02 / M08-F08. */
type ApiError = Error & {
  response?: { status?: number; data?: { error?: string; references?: string[] } }
}

function serverError(err: unknown, fallback: string): string {
  return (err as Error)?.message || fallback
}

// ── Derived strings (faceted filters need stable string values) ─────────────
const tankNameOf = (n: FuelNozzleDto) => n.tankName ?? "(unknown tank)"
const activeOf = (n: FuelNozzleDto) => (n.isActive ? "Active" : "Inactive")

/** Faceted multi-select filter — keep the row if its value is in the picked set. */
const multiSelectFilter: FilterFn<FuelNozzleDto> = (row, columnId, value) => {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.includes(row.getValue(columnId))
}

export function FuelNozzlesPanel({ stationId }: { stationId: string }) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: FUEL_NOZZLES_KEY(stationId),
    queryFn: () => getFuelNozzlesByStation(stationId),
    enabled: !!stationId,
  })
  const nozzles: FuelNozzleDto[] = data?.data ?? []

  // Tanks feed the Add / Edit Tank `<Select>` and the row's tank-context
  // sub-line. Lookups by id resolve the linked tank's fuel-type name.
  const { data: tanksData, isLoading: tanksLoading } = useQuery({
    queryKey: FUEL_TANKS_KEY(stationId),
    queryFn: () => getFuelTanksByStation(stationId),
    enabled: !!stationId,
  })
  const tanks: FuelTankDto[] = tanksData?.data ?? []

  const invalidateNozzles = () => {
    queryClient.invalidateQueries({ queryKey: FUEL_NOZZLES_KEY(stationId) })
    // Tank.nozzleCount changes after add/delete; refresh so Tanks panel stays
    // in sync if the user navigates back. Same pattern as M08-F02.
    queryClient.invalidateQueries({ queryKey: FUEL_TANKS_KEY(stationId) })
    // M08-F08 Sellable badge depends on having a tank + active price (not
    // nozzles), but the count badge on Fuel Types is unchanged here.
    queryClient.invalidateQueries({ queryKey: FUEL_TYPES_KEY(stationId) })
  }

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FuelNozzleDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FuelNozzleDto | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<FuelNozzleDto | null>(
    null
  )
  const [blockReferences, setBlockReferences] = useState<string[] | null>(null)

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: { nozzleNumber: string; tankId: string }) =>
      createFuelNozzle(stationId, payload),
    onSuccess: () => {
      invalidateNozzles()
      toast.success("Nozzle added.")
      setAddOpen(false)
    },
    // Failure stays as an inline error inside the dialog (`serverError` prop).
  })

  const updateMutation = useMutation({
    mutationFn: ({
      nozzleId,
      payload,
    }: {
      nozzleId: string
      payload: { nozzleNumber: string; tankId: string }
    }) => updateFuelNozzle(stationId, nozzleId, payload),
    onSuccess: () => {
      invalidateNozzles()
      toast.success("Nozzle updated.")
      setEditTarget(null)
    },
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setFuelNozzleActive(stationId, id, { isActive }),
    onSuccess: (_res, vars) => {
      invalidateNozzles()
      toast.success(vars.isActive ? "Nozzle activated." : "Nozzle deactivated.")
      setDeactivateTarget(null)
    },
    onError: (err) => {
      toast.error(serverError(err, "Failed to update nozzle."))
      setDeactivateTarget(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (nozzleId: string) => deleteFuelNozzle(stationId, nozzleId),
    onSuccess: (res) => {
      // 409 throws into onError; success+Blocked routes through here.
      if (res.data?.blocked) {
        setBlockReferences(res.data.blockingReferences ?? ["existing references"])
        return
      }
      invalidateNozzles()
      toast.success("Nozzle deleted.")
      setDeleteTarget(null)
    },
    onError: (err) => {
      const ae = err as ApiError
      if (ae.response?.status === 409) {
        setBlockReferences(ae.response.data?.references ?? ["existing references"])
        return
      }
      toast.error(serverError(err, "Failed to delete nozzle."))
      setDeleteTarget(null)
    },
  })

  // ── Action handlers ─────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    createMutation.reset()
    setAddOpen(true)
  }
  const handleOpenEdit = (n: FuelNozzleDto) => {
    updateMutation.reset()
    setEditTarget(n)
  }
  const handleOpenDelete = (n: FuelNozzleDto) => {
    setBlockReferences(null)
    setDeleteTarget(n)
  }
  const handleActivate = (n: FuelNozzleDto) =>
    activeMutation.mutate({ id: n.id, isActive: true })
  const handleDeactivate = (n: FuelNozzleDto) => setDeactivateTarget(n)
  const togglePending = activeMutation.isPending

  // ── Columns ─────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<FuelNozzleDto>[]>(
    () => [
      {
        accessorKey: "nozzleNumber",
        meta: { title: "Nozzle" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nozzle" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.nozzleNumber}</span>
        ),
      },
      {
        id: "tank",
        accessorFn: tankNameOf,
        meta: { title: "Tank" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tank" />
        ),
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const tank = tanks.find((t) => t.id === row.original.tankId)
          return (
            <div className="flex flex-col">
              <span>{row.original.tankName ?? "(unknown tank)"}</span>
              {tank?.fuelTypeName ? (
                <span className="text-xs text-muted-foreground">
                  {tank.fuelTypeName}
                </span>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "status",
        accessorFn: activeOf,
        meta: { title: "Status" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        filterFn: multiSelectFilter,
        cell: ({ row }) => <StatusBadge isActive={row.original.isActive} />,
      },
      {
        id: "toggle",
        meta: { title: "Active" },
        header: "Active",
        enableSorting: false,
        cell: ({ row }) => (
          <ActiveToggle
            isActive={row.original.isActive}
            entityLabel={`nozzle ${row.original.nozzleNumber}`}
            isPending={togglePending}
            onActivate={() => handleActivate(row.original)}
            onDeactivate={() => handleDeactivate(row.original)}
          />
        ),
      },
      {
        accessorKey: "shiftAssignmentCount",
        meta: { title: "Assignments", align: "end" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Assignments" align="end" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.shiftAssignmentCount}</span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableHiding: false,
        meta: { align: "end" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
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
              onClick={() => handleOpenDelete(row.original)}
            >
              <IconTrash className="size-4" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    // handlers are stable; toggle pending + tanks list change rendered output
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [togglePending, tanks]
  )

  // ── Mobile card (< md breakpoint) ───────────────────────────────────────
  const renderMobileCard = (row: Row<FuelNozzleDto>) => {
    const n = row.original
    const tank = tanks.find((t) => t.id === n.tankId)
    return (
      <div
        data-inactive={!n.isActive}
        className="rounded-xl border border-border bg-card p-4 shadow-sm data-[inactive=true]:bg-muted/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-medium">Nozzle {n.nozzleNumber}</span>
            <span className="text-xs text-muted-foreground">
              {n.tankName ?? "(unknown tank)"}
              {tank?.fuelTypeName ? ` · ${tank.fuelTypeName}` : ""}
            </span>
          </div>
          <StatusBadge isActive={n.isActive} />
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          {n.shiftAssignmentCount}{" "}
          {n.shiftAssignmentCount === 1 ? "assignment" : "assignments"}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <ActiveToggle
            isActive={n.isActive}
            entityLabel={`nozzle ${n.nozzleNumber}`}
            isPending={togglePending}
            onActivate={() => handleActivate(n)}
            onDeactivate={() => handleDeactivate(n)}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(n)}
            >
              <IconPencil className="size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenDelete(n)}
            >
              <IconTrash className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <ConfigPanelCard
        icon={IconGasStation}
        title="Nozzles"
        description="Manage the dispensing nozzles at this station."
      >
        <div className="px-6 pb-6 text-sm text-destructive">
          Failed to load nozzles. {String(error)}
        </div>
      </ConfigPanelCard>
    )
  }

  // Station with no tanks at all → CTA back to the Tanks panel; hide Add.
  if (!isLoading && !tanksLoading && tanks.length === 0) {
    return (
      <ConfigPanelCard
        icon={IconGasStation}
        title="Nozzles"
        description="Manage the dispensing nozzles at this station."
      >
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <IconGasStation className="size-10 text-muted-foreground" stroke={1.5} />
          <div className="space-y-1">
            <p className="text-sm font-medium">No tanks yet.</p>
            <p className="text-sm text-muted-foreground">
              Add a tank before adding nozzles.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link
              to="/dashboard/station/$stationId/configuration/tanks"
              params={{ stationId }}
            >
              Set up tanks →
            </Link>
          </Button>
        </div>
      </ConfigPanelCard>
    )
  }

  return (
    <ConfigPanelCard
      icon={IconGasStation}
      title="Nozzles"
      description="Each nozzle dispenses from exactly one tank. Numbers are free text per station."
      action={
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto">
          <IconPlus className="size-4" />
          Add nozzle
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={nozzles}
        isLoading={isLoading}
        getRowId={(n) => n.id}
        searchPlaceholder="Search nozzles…"
        renderMobileCard={renderMobileCard}
        rowClassName={(row) =>
          !row.original.isActive ? "text-muted-foreground" : undefined
        }
        initialSorting={[{ id: "nozzleNumber", desc: false }]}
        emptyState={
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No nozzles yet. Add one to get started.
          </p>
        }
        filters={[
          {
            columnId: "tank",
            title: "Tank",
            options: Array.from(
              new Set(nozzles.map((n) => n.tankName ?? "(unknown tank)"))
            ).map((name) => ({ label: name, value: name })),
          },
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ],
          },
        ]}
      />

      <NozzleFormDialog
        mode="add"
        open={addOpen}
        target={null}
        tanks={tanks}
        existing={nozzles}
        isPending={createMutation.isPending}
        serverError={
          createMutation.isError
            ? serverError(createMutation.error, "Failed to add nozzle.")
            : null
        }
        onClearServerError={() => createMutation.reset()}
        onOpenChange={(o) => {
          if (!o) {
            setAddOpen(false)
            createMutation.reset()
          }
        }}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      <NozzleFormDialog
        mode="edit"
        open={!!editTarget}
        target={editTarget}
        tanks={tanks}
        existing={nozzles}
        isPending={updateMutation.isPending}
        serverError={
          updateMutation.isError
            ? serverError(updateMutation.error, "Failed to update nozzle.")
            : null
        }
        onClearServerError={() => updateMutation.reset()}
        onOpenChange={(o) => {
          if (!o) {
            setEditTarget(null)
            updateMutation.reset()
          }
        }}
        onSubmit={(payload) => {
          if (!editTarget) return
          updateMutation.mutate({ nozzleId: editTarget.id, payload })
        }}
      />

      <DeactivateNozzleDialog
        target={deactivateTarget}
        isPending={activeMutation.isPending}
        onOpenChange={(o) => {
          if (!o) setDeactivateTarget(null)
        }}
        onConfirm={() =>
          deactivateTarget &&
          activeMutation.mutate({ id: deactivateTarget.id, isActive: false })
        }
      />

      <DeleteNozzleDialog
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
    </ConfigPanelCard>
  )
}

// ── Add / Edit dialog (shared shell) ────────────────────────────────────────
/**
 * One dialog component, two `mode`s — same pattern as M08-F02's TankFormDialog.
 * Add starts blank; Edit pre-fills from `target` via `useEffect` keyed on
 * `target?.id`. When the Edit dialog detects the tank is being reassigned
 * (`tankId !== target.tankId`), it renders a destructive-tone warning Alert
 * and turns Save into "Tap again to confirm" — first click sets the
 * confirmation flag, second click fires the mutation. Picking the original
 * tank back resets the flag. Wrapped in `<form onSubmit>` so Enter submits.
 */
function NozzleFormDialog({
  mode,
  open,
  target,
  tanks,
  existing,
  isPending,
  serverError,
  onClearServerError,
  onOpenChange,
  onSubmit,
}: {
  mode: "add" | "edit"
  open: boolean
  target: FuelNozzleDto | null
  tanks: FuelTankDto[]
  existing: FuelNozzleDto[]
  isPending: boolean
  serverError: string | null
  onClearServerError: () => void
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: { nozzleNumber: string; tankId: string }) => void
}) {
  const [nozzleNumber, setNozzleNumber] = useState("")
  const [tankId, setTankId] = useState<string>("")
  const [confirmedReassign, setConfirmedReassign] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Intentional sync of local form state to the `open` / `target` props —
  // sanctioned use of useEffect for prop→state seeding, same shape as
  // TankFormDialog in fuel-tanks-panel.tsx.
  useEffect(() => {
    if (!open) {
      setNozzleNumber("")
      setTankId("")
      setConfirmedReassign(false)
      setError(null)
      return
    }
    if (mode === "edit" && target) {
      setNozzleNumber(target.nozzleNumber)
      setTankId(target.tankId)
    } else {
      setNozzleNumber("")
      setTankId(tanks[0]?.id ?? "")
    }
    setConfirmedReassign(false)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, target?.id, tanks])

  const isReassign = mode === "edit" && !!target && tankId !== target.tankId

  const clearLocalError = () => {
    if (error) setError(null)
    if (serverError) onClearServerError()
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const parsed = nozzleFormSchema.safeParse({ nozzleNumber, tankId })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    const trimmed = parsed.data.nozzleNumber
    // Per-tank uniqueness (mirrors backend Create+Update handlers), ignoring
    // the row being edited. Belt-and-braces: backend is authoritative.
    const duplicate = existing.some(
      (n) =>
        n.id !== target?.id &&
        n.tankId === parsed.data.tankId &&
        n.nozzleNumber.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) {
      setError("A nozzle with this number already exists on the chosen tank.")
      return
    }
    if (isReassign && !confirmedReassign) {
      setConfirmedReassign(true)
      setError(null)
      return
    }
    setError(null)
    onSubmit({ nozzleNumber: trimmed, tankId: parsed.data.tankId })
  }

  const titleText =
    mode === "add" ? "Add nozzle" : `Edit nozzle ${target?.nozzleNumber ?? ""}`
  const saveLabel = isPending
    ? mode === "add"
      ? "Adding…"
      : "Saving…"
    : isReassign && !confirmedReassign
    ? "Tap again to confirm"
    : mode === "add"
    ? "Add nozzle"
    : "Save"

  const displayError = error ?? serverError

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
              ? "Pick a tank and give the nozzle a number that's unique on that tank."
              : "Change the number or move this nozzle to a different tank. Reassigning the tank asks for an extra confirmation."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="contents">
          <div className="grid gap-1.5">
            <Label htmlFor="nozzle-number" className="text-sm font-semibold">
              Nozzle number
            </Label>
            <Input
              id="nozzle-number"
              value={nozzleNumber}
              onChange={(e) => {
                setNozzleNumber(e.target.value)
                clearLocalError()
              }}
              placeholder="e.g. 1, A1, North-2"
              maxLength={20}
              className="w-full"
              autoFocus
              aria-invalid={!!displayError}
              aria-describedby={displayError ? "nozzle-number-error" : undefined}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nozzle-tank" className="text-sm font-semibold">
              Tank
            </Label>
            <Select
              value={tankId}
              onValueChange={(v) => {
                setTankId(v)
                setConfirmedReassign(false)
                clearLocalError()
              }}
            >
              <SelectTrigger id="nozzle-tank" className="w-full">
                <SelectValue placeholder="Pick a tank" />
              </SelectTrigger>
              <SelectContent>
                {tanks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name && t.name.trim() ? t.name : "(unnamed tank)"}
                    {t.fuelTypeName ? ` — ${t.fuelTypeName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isReassign && (
            <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
              <IconAlertTriangle className="size-4" />
              <AlertDescription>
                Moving this nozzle to a different tank. Existing shift records
                keep the old tank reference for reports.
                {confirmedReassign ? null : " Tap Save again to confirm."}
              </AlertDescription>
            </Alert>
          )}

          {displayError && (
            <p
              id="nozzle-number-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {displayError}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending || !nozzleNumber.trim() || !tankId}
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

// ── Deactivate confirm dialog ───────────────────────────────────────────────
/**
 * Confirm before flipping a nozzle to Inactive. Soft-deactivate is never
 * blocked (per M08-F03 design — assignments keep their nozzleId reference,
 * the nozzle just isn't available to new shifts). Cancelling here leaves
 * `isActive` unchanged so the controlled Switch snaps back automatically.
 */
function DeactivateNozzleDialog({
  target,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  target: FuelNozzleDto | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-4 p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Deactivate nozzle {target?.nozzleNumber}?
          </DialogTitle>
          <DialogDescription>
            Existing shift records are kept; the nozzle won&apos;t be available
            to new shifts until you reactivate it.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deactivating…" : "Deactivate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete confirm dialog (shows 409 references) ────────────────────────────
/**
 * Hard-delete confirm. When the server returns 409 (or success+Blocked from
 * the preflight count), the dialog stays open with a destructive Alert
 * listing blocking references (e.g. "3 shift assignments") and the Delete
 * button is replaced with Close. Same shape as M08-F02 / M08-F08.
 */
function DeleteNozzleDialog({
  target,
  references,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  target: FuelNozzleDto | null
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
            Delete nozzle {target?.nozzleNumber}?
          </DialogTitle>
          <DialogDescription>
            This permanently removes the nozzle from this station. This cannot
            be undone.
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
              {isPending ? "Deleting…" : "Delete nozzle"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
