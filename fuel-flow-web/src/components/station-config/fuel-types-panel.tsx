/**
 * [M08-F08] Fuel Type Management — the Fuel Types tab of Station Configuration
 * (M08-F07). Owner + Manager can view all of the station's fuel types (with
 * source, status, tank count, and sellable state), add a type (OMC catalog or
 * custom), rename, and activate/deactivate. Replaces the tab's placeholder.
 *
 * Tab contents render English literals to match sibling config screens; the
 * i18next call-site sweep is tracked under M08-F05-R05.
 */
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconFlame,
  IconPencil,
  IconPlus,
} from "@tabler/icons-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DataTable } from "@/components/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import {
  createFuelType,
  getFuelTypesByStation,
  renameFuelType,
  setFuelTypeActive,
  type FuelTypeDto,
} from "@/lib/api/stations/fuel-types"
import {
  getStationsByOrganization,
  type OrganizationStationDto,
} from "@/lib/api/station-management"
import {
  getOMCFuelTypesByOmc,
  type OMCFuelTypeDto,
} from "@/lib/api/omc-fuel-types"
import { useAuthStore } from "@/stores/auth-store"
import { fuelTypeNameSchema } from "@/lib/validators/fuel-type"

const FUEL_TYPES_KEY = (stationId: string) => ["stations", stationId, "fuel-types"]

/**
 * The Axios client (`lib/api/client.ts`) wraps non-401 failures in a plain
 * `Error` whose `message` is already the server's `{ error }` string and which
 * carries the original `response`. Type that shape so we can read status +
 * references without relying on `instanceof AxiosError` (which never holds here).
 */
type ApiError = Error & {
  response?: { status?: number; data?: { error?: string; references?: string[] } }
}

/** The interceptor already resolves the server message into `.message`. */
function serverError(err: unknown, fallback: string): string {
  return (err as Error)?.message || fallback
}

// ── Derived string values (used for sorting, faceted filters, search) ───────
const sourceOf = (ft: FuelTypeDto) => (ft.isCustom ? "Custom" : "OMC")
const statusOf = (ft: FuelTypeDto) => (ft.isActive ? "Active" : "Inactive")
const sellableOf = (ft: FuelTypeDto) =>
  ft.isSellable ? "Sellable" : "Not yet sellable"

/** Faceted multi-select: keep the row if its value is one of the selected. */
const multiSelectFilter: FilterFn<FuelTypeDto> = (row, columnId, value) => {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.includes(row.getValue(columnId))
}

// ── Reusable badge renderers (shared by table cells + mobile cards) ─────────
function SourceBadge({ ft }: { ft: FuelTypeDto }) {
  return ft.isCustom ? (
    <Badge className="border-transparent bg-primary/10 text-primary hover:bg-primary/10">
      Custom
    </Badge>
  ) : (
    <Badge variant="outline">OMC</Badge>
  )
}

function StatusBadge({ ft }: { ft: FuelTypeDto }) {
  return ft.isActive ? (
    <Badge className="border-transparent bg-success/10 text-success hover:bg-success/10">
      Active
    </Badge>
  ) : (
    <Badge className="border-transparent bg-destructive/10 text-destructive hover:bg-destructive/10">
      Inactive
    </Badge>
  )
}

function SellableBadge({ ft }: { ft: FuelTypeDto }) {
  return ft.isSellable ? (
    <Badge className="border-transparent bg-success/10 text-success hover:bg-success/10">
      Sellable
    </Badge>
  ) : (
    <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
      Not yet sellable
    </Badge>
  )
}

/**
 * Active/Inactive toggle — a real Switch reflecting `ft.isActive`. Flipping it
 * ON activates immediately; flipping it OFF opens the confirm dialog (which can
 * surface a 409 "still in use" block), so the switch is *controlled* by the
 * query data and snaps back automatically if the user cancels. Wrapped in a
 * tooltip that spells out what the toggle will do.
 */
function FuelTypeToggle({
  ft,
  isPending,
  onActivate,
  onDeactivate,
}: {
  ft: FuelTypeDto
  isPending: boolean
  onActivate: (ft: FuelTypeDto) => void
  onDeactivate: (ft: FuelTypeDto) => void
}) {
  return (
    <Tooltip>
      {/* Span wrapper: keeps the tooltip's data-state off the Switch, so the
          Switch's own checked/unchecked data-state drives its styling. */}
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Switch
            checked={ft.isActive}
            disabled={isPending}
            onCheckedChange={(checked) =>
              checked ? onActivate(ft) : onDeactivate(ft)
            }
            aria-label={
              ft.isActive ? `Deactivate ${ft.name}` : `Activate ${ft.name}`
            }
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {ft.isActive ? "Active — turn off to deactivate" : "Inactive — turn on to activate"}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Row/card actions — a proper Rename button plus the Active/Inactive toggle, so
 * both primary actions are always visible on wide screens and inside the mobile
 * card footer (no kebab menu).
 */
function FuelTypeActions({
  ft,
  isPending,
  onRename,
  onActivate,
  onDeactivate,
  className,
}: {
  ft: FuelTypeDto
  isPending: boolean
  onRename: (ft: FuelTypeDto) => void
  onActivate: (ft: FuelTypeDto) => void
  onDeactivate: (ft: FuelTypeDto) => void
  className?: string
}) {
  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={() => onRename(ft)}>
        <IconPencil className="size-4" />
        Rename
      </Button>
      <FuelTypeToggle
        ft={ft}
        isPending={isPending}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    </div>
  )
}

export function FuelTypesPanel({ stationId }: { stationId: string }) {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((s) => s.organization?.id)

  const { data, isLoading, error } = useQuery({
    queryKey: FUEL_TYPES_KEY(stationId),
    queryFn: () => getFuelTypesByStation(stationId),
    enabled: !!stationId,
  })
  const fuelTypes: FuelTypeDto[] = data?.data ?? []

  // Resolve the station's OMC so we can offer its catalog when adding.
  const { data: orgStationsData } = useQuery({
    queryKey: ["stations", "by-organization", organizationId],
    queryFn: () => getStationsByOrganization(organizationId!),
    enabled: !!organizationId,
  })
  const orgStations: OrganizationStationDto[] = orgStationsData?.data ?? []
  const stationOmcId = orgStations.find((s) => s.id === stationId)?.omcId

  const { data: omcData } = useQuery({
    queryKey: ["omc-fuel-types", stationOmcId],
    queryFn: () => getOMCFuelTypesByOmc(stationOmcId!),
    enabled: !!stationOmcId,
  })
  const omcFuelTypes: OMCFuelTypeDto[] = omcData?.data ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: FUEL_TYPES_KEY(stationId) })

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<FuelTypeDto | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<FuelTypeDto | null>(null)

  const [blockReferences, setBlockReferences] = useState<string[] | null>(null)

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; unit: string; isCustom: boolean; omcId?: string }) =>
      createFuelType(stationId, payload),
    onSuccess: () => {
      invalidate()
      toast.success("Fuel type added.")
      setAddOpen(false)
    },
    // Failures are surfaced inline in the dialog (see `serverError` prop) rather
    // than as a toast, so the message sits next to the field it's about.
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameFuelType(stationId, id, { name }),
    onSuccess: () => {
      invalidate()
      toast.success("Fuel type renamed.")
      setRenameTarget(null)
    },
    // Failures surfaced inline in the rename dialog, not as a toast.
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setFuelTypeActive(stationId, id, { isActive }),
    onSuccess: (_res, vars) => {
      invalidate()
      toast.success(vars.isActive ? "Fuel type activated." : "Fuel type deactivated.")
      setDeactivateTarget(null)
    },
    onError: (err) => {
      // 409 = blocked by references; surface them in the confirm dialog.
      const ae = err as ApiError
      if (ae.response?.status === 409) {
        setBlockReferences(ae.response.data?.references ?? ["existing references"])
        return
      }
      toast.error(serverError(err, "Failed to update fuel type."))
      setDeactivateTarget(null)
    },
  })

  // ── Action handlers (shared by table rows + mobile cards) ───────────────
  const handleRename = (ft: FuelTypeDto) => {
    renameMutation.reset() // drop any stale inline error from a previous open
    setRenameTarget(ft)
  }
  const handleOpenAdd = () => {
    createMutation.reset()
    setAddOpen(true)
  }
  const handleActivate = (ft: FuelTypeDto) =>
    activeMutation.mutate({ id: ft.id, isActive: true })
  const handleDeactivate = (ft: FuelTypeDto) => {
    setBlockReferences(null)
    setDeactivateTarget(ft)
  }
  const togglePending = activeMutation.isPending

  // ── Column definitions for the shared DataTable ─────────────────────────
  const columns = useMemo<ColumnDef<FuelTypeDto>[]>(
    () => [
      {
        accessorKey: "name",
        meta: { title: "Name" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
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
        cell: ({ row }) => <SourceBadge ft={row.original} />,
      },
      {
        id: "status",
        accessorFn: statusOf,
        meta: { title: "Status" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        filterFn: multiSelectFilter,
        cell: ({ row }) => <StatusBadge ft={row.original} />,
      },
      {
        accessorKey: "tankCount",
        meta: { title: "Tanks", align: "end" },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tanks" align="end" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.tankCount}</span>
        ),
      },
      {
        id: "sellable",
        accessorFn: sellableOf,
        meta: { title: "Sellable" },
        header: "Sellable",
        enableSorting: false,
        filterFn: multiSelectFilter,
        cell: ({ row }) => <SellableBadge ft={row.original} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableHiding: false,
        meta: { align: "end" },
        cell: ({ row }) => (
          <FuelTypeActions
            ft={row.original}
            isPending={togglePending}
            onRename={handleRename}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            className="flex items-center justify-end gap-3"
          />
        ),
      },
    ],
    // handlers are stable; only the pending flag changes the rendered output
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [togglePending]
  )

  // ── Mobile card renderer (< md breakpoint) ──────────────────────────────
  const renderMobileCard = (row: Row<FuelTypeDto>) => {
    const ft = row.original
    return (
      <div
        data-inactive={!ft.isActive}
        className="rounded-xl border border-border bg-card p-4 shadow-sm data-[inactive=true]:bg-muted/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-medium">{ft.name}</span>
            <span className="text-xs text-muted-foreground">
              Sold per {ft.unit}
            </span>
          </div>
          <SourceBadge ft={ft} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge ft={ft} />
          <SellableBadge ft={ft} />
          <span className="ms-auto text-xs text-muted-foreground">
            {ft.tankCount} {ft.tankCount === 1 ? "tank" : "tanks"}
          </span>
        </div>

        <FuelTypeActions
          ft={ft}
          isPending={togglePending}
          onRename={handleRename}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3"
        />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
        <IconAlertTriangle className="size-4" />
        <AlertDescription>Failed to load fuel types. {String(error)}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <IconFlame className="size-5 shrink-0 text-primary" />
            Fuel Types
          </CardTitle>
          <CardDescription>
            Manage the fuel types this station sells. A type is sellable once it has an
            active price and at least one tank.
          </CardDescription>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="w-full shrink-0 sm:w-auto"
        >
          <IconPlus className="size-4" />
          Add fuel type
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={fuelTypes}
          isLoading={isLoading}
          getRowId={(ft) => ft.id}
          searchPlaceholder="Search fuel types…"
          renderMobileCard={renderMobileCard}
          rowClassName={(row) =>
            !row.original.isActive ? "text-muted-foreground" : undefined
          }
          initialSorting={[{ id: "name", desc: false }]}
          emptyState={
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No fuel types yet. Add one to get started.
            </p>
          }
          filters={[
            {
              columnId: "status",
              title: "Status",
              options: [
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
              ],
            },
            {
              columnId: "source",
              title: "Source",
              options: [
                { label: "OMC", value: "OMC" },
                { label: "Custom", value: "Custom" },
              ],
            },
            {
              columnId: "sellable",
              title: "Sellable",
              options: [
                { label: "Sellable", value: "Sellable" },
                { label: "Not yet sellable", value: "Not yet sellable" },
              ],
            },
          ]}
        />
      </CardContent>

      <AddFuelTypeDialog
        open={addOpen}
        onOpenChange={(o) => {
          if (!o) createMutation.reset()
          setAddOpen(o)
        }}
        omcFuelTypes={omcFuelTypes}
        existing={fuelTypes}
        isPending={createMutation.isPending}
        serverError={
          createMutation.isError
            ? serverError(createMutation.error, "Failed to add fuel type.")
            : null
        }
        onClearServerError={() => createMutation.reset()}
        onAdd={(payload) => createMutation.mutate(payload)}
      />

      <RenameFuelTypeDialog
        target={renameTarget}
        existing={fuelTypes}
        onOpenChange={(o) => {
          if (!o) {
            renameMutation.reset()
            setRenameTarget(null)
          }
        }}
        isPending={renameMutation.isPending}
        serverError={
          renameMutation.isError
            ? serverError(renameMutation.error, "Failed to rename fuel type.")
            : null
        }
        onClearServerError={() => renameMutation.reset()}
        onRename={(name) =>
          renameTarget && renameMutation.mutate({ id: renameTarget.id, name })
        }
      />

      <DeactivateDialog
        target={deactivateTarget}
        references={blockReferences}
        isPending={activeMutation.isPending}
        onOpenChange={(o) => {
          if (!o) {
            setDeactivateTarget(null)
            setBlockReferences(null)
          }
        }}
        onConfirm={() =>
          deactivateTarget &&
          activeMutation.mutate({ id: deactivateTarget.id, isActive: false })
        }
      />
    </Card>
  )
}

// ── Add dialog ──────────────────────────────────────────────────────────────
/**
 * Tabbed add dialog: an explicit "From OMC" tab (single-select catalog list)
 * and a "Custom" tab (Name + Unit inputs). Each tab owns its own submit
 * button, so what the user is saving — OMC-derived vs Custom — is never
 * ambiguous. The "From OMC" tab is disabled when the station has no OMC
 * or every catalog entry is already added; the dialog opens on whichever
 * tab is actually useful for this station.
 */
function AddFuelTypeDialog({
  open,
  onOpenChange,
  omcFuelTypes,
  existing,
  isPending,
  serverError,
  onClearServerError,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  omcFuelTypes: OMCFuelTypeDto[]
  existing: FuelTypeDto[]
  isPending: boolean
  serverError: string | null
  onClearServerError: () => void
  onAdd: (payload: { name: string; unit: string; isCustom: boolean; omcId?: string }) => void
}) {
  const existingNames = new Set(existing.map((f) => f.name.toLowerCase()))
  const availableOmc = omcFuelTypes.filter(
    (o) => !existingNames.has(o.name.toLowerCase())
  )
  const hasOmcAvailable = availableOmc.length > 0

  const [tab, setTab] = useState<"omc" | "custom">(
    hasOmcAvailable ? "omc" : "custom"
  )
  const [omcChoiceId, setOmcChoiceId] = useState<string>("")
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("L")
  // Client-side validation message for the custom Name field (required / too
  // long / duplicate) — shown inline beneath the input, never as a toast.
  const [nameError, setNameError] = useState<string | null>(null)

  // Reset to a clean form whenever the dialog closes so reopening is fresh.
  // Intentional open/close sync — the dialog's local form state mirrors the
  // `open` prop, which is the sanctioned use of an effect here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setOmcChoiceId("")
      setName("")
      setUnit("L")
      setNameError(null)
      setTab(hasOmcAvailable ? "omc" : "custom")
    }
  }, [open, hasOmcAvailable])
  /* eslint-enable react-hooks/set-state-in-effect */

  // The custom Name field shows the client validation error first, then any
  // server-side failure (e.g. a duplicate that slipped past the local check).
  const customError = nameError ?? serverError

  const clearErrors = () => {
    if (nameError) setNameError(null)
    if (serverError) onClearServerError()
  }

  const submitOmc = () => {
    const choice = availableOmc.find((o) => o.id === omcChoiceId)
    if (!choice) return // the submit button is disabled until a choice is made
    onAdd({
      name: choice.name,
      unit: choice.unit,
      omcId: choice.omcId,
      isCustom: false,
    })
  }

  const submitCustom = () => {
    const parsed = fuelTypeNameSchema.safeParse(name)
    if (!parsed.success) {
      setNameError(parsed.error.issues[0].message)
      return
    }
    const n = parsed.data
    if (existingNames.has(n.toLowerCase())) {
      setNameError("A fuel type with this name already exists.")
      return
    }
    onAdd({ name: n, unit, isCustom: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-4 p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add fuel type
          </DialogTitle>
          <DialogDescription>
            Pick one from your OMC catalog or create a custom one.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "omc" | "custom")}
          className="gap-4"
        >
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-lg">
            <TabsTrigger value="omc" disabled={!hasOmcAvailable}>
              From OMC
            </TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          {/* ── From OMC tab ────────────────────────────────────────────── */}
          <TabsContent value="omc" className="space-y-4">
            {hasOmcAvailable ? (
              <>
                <div
                  role="radiogroup"
                  aria-label="OMC catalog"
                  className="space-y-2"
                >
                  {availableOmc.map((o) => {
                    const selected = omcChoiceId === o.id
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setOmcChoiceId(o.id)}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-start outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <span className="text-sm font-medium text-foreground">
                          {o.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {o.unit}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {serverError && (
                  <p className="text-sm text-destructive" role="alert">
                    {serverError}
                  </p>
                )}
                <Button
                  type="button"
                  onClick={submitOmc}
                  disabled={isPending || !omcChoiceId}
                  className="h-11 w-full text-sm font-semibold"
                >
                  {isPending ? "Adding…" : "Add from OMC catalog"}
                </Button>
              </>
            ) : (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                {omcFuelTypes.length === 0
                  ? "This station has no OMC catalog to pick from."
                  : "All OMC catalog fuel types are already added."}
              </p>
            )}
          </TabsContent>

          {/* ── Custom tab ─────────────────────────────────────────────── */}
          <TabsContent value="custom" className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="add-ft-name" className="text-sm font-semibold">
                Name
              </Label>
              <Input
                id="add-ft-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  clearErrors()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    submitCustom()
                  }
                }}
                placeholder="e.g. Diesel Premium"
                aria-invalid={!!customError}
                aria-describedby={customError ? "add-ft-name-error" : undefined}
                className="w-full"
              />
              {customError && (
                <p
                  id="add-ft-name-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {customError}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Liter (L)</SelectItem>
                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={submitCustom}
              disabled={isPending}
              className="h-11 w-full text-sm font-semibold"
            >
              {isPending ? "Adding…" : "Add custom fuel type"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ── Rename dialog ─────────────────────────────────────────────────────────
/**
 * Rename Custom fuel types only. OMC catalog rows aren't renameable on this
 * screen (they use the OMC's official name); the dialog renders a read-only
 * explanation in that case. Pre-fills the name field whenever a new target
 * is opened — using `useEffect` on `target.id` because Radix's
 * `onOpenChange` only fires for internal close events, not when the parent
 * sets `open=true` from outside.
 */
function RenameFuelTypeDialog({
  target,
  existing,
  onOpenChange,
  isPending,
  serverError,
  onClearServerError,
  onRename,
}: {
  target: FuelTypeDto | null
  existing: FuelTypeDto[]
  onOpenChange: (open: boolean) => void
  isPending: boolean
  serverError: string | null
  onClearServerError: () => void
  onRename: (name: string) => void
}) {
  const isOmc = target ? !target.isCustom : false
  const [name, setName] = useState("")
  // Inline client validation for the Name field (required / too long /
  // duplicate) — shown beneath the input, not as a toast.
  const [nameError, setNameError] = useState<string | null>(null)

  // Seed / reset the name field whenever a new target is opened. Intentional
  // sync of local form state to the incoming `target` prop.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (target) setName(target.name)
    else setName("")
    setNameError(null)
  }, [target?.id])
  /* eslint-enable react-hooks/set-state-in-effect */

  const trimmed = name.trim()
  const unchanged = !!target && trimmed === target.name.trim()
  const displayError = nameError ?? serverError

  const handleSave = () => {
    const parsed = fuelTypeNameSchema.safeParse(name)
    if (!parsed.success) {
      setNameError(parsed.error.issues[0].message)
      return
    }
    const n = parsed.data
    // Per-station uniqueness (case-insensitive), ignoring the row being renamed.
    const duplicate = existing.some(
      (f) =>
        f.id !== target?.id &&
        f.name.trim().toLowerCase() === n.toLowerCase()
    )
    if (duplicate) {
      setNameError("A fuel type with this name already exists.")
      return
    }
    onRename(n)
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-4 p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isOmc ? "Can't rename this fuel type" : "Rename fuel type"}
          </DialogTitle>
          <DialogDescription>
            {isOmc
              ? "This fuel type comes from your OMC catalog and uses the OMC's official name. If you need a different name, add a custom fuel type instead."
              : "Renaming affects only this station; historical records are unchanged."}
          </DialogDescription>
        </DialogHeader>

        {!isOmc && (
          <div className="grid gap-1.5">
            <Label htmlFor="rename-ft-name" className="text-sm font-semibold">
              Name
            </Label>
            <Input
              id="rename-ft-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError(null)
                if (serverError) onClearServerError()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && trimmed && !unchanged) {
                  e.preventDefault()
                  handleSave()
                }
              }}
              aria-invalid={!!displayError}
              aria-describedby={displayError ? "rename-ft-name-error" : undefined}
              className="w-full"
            />
            {displayError && (
              <p
                id="rename-ft-name-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {displayError}
              </p>
            )}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          {isOmc ? (
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          ) : (
            <>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleSave}
                disabled={isPending || !trimmed || unchanged}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Deactivate confirm dialog (shows 409 references) ────────────────────────
function DeactivateDialog({
  target,
  references,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  target: FuelTypeDto | null
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
            Deactivate {target?.name}?
          </DialogTitle>
          <DialogDescription>
            Deactivated fuel types are hidden from new price, tank, and nozzle
            pickers but kept for historical reporting.
          </DialogDescription>
        </DialogHeader>

        {blocked && (
          <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
            <IconAlertTriangle className="size-4" />
            <AlertDescription>
              Can&apos;t deactivate — still in use by {references!.join(" and ")}.
              Remove those references first.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">{blocked ? "Close" : "Cancel"}</Button>
          </DialogClose>
          {!blocked && (
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
