/**
 * [M08-F08] Fuel Type Management — the Fuel Types tab of Station Configuration
 * (M08-F07). Owner + Manager can view all of the station's fuel types (with
 * source, status, tank count, and sellable state), add a type (OMC catalog or
 * custom), rename, and activate/deactivate. Replaces the tab's placeholder.
 *
 * Tab contents render English literals to match sibling config screens; the
 * i18next call-site sweep is tracked under M08-F05-R05.
 */
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconFlame,
  IconPencil,
  IconPlus,
  IconToggleLeft,
  IconToggleRight,
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
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    onError: (err) => toast.error(serverError(err, "Failed to add fuel type.")),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameFuelType(stationId, id, { name }),
    onSuccess: () => {
      invalidate()
      toast.success("Fuel type renamed.")
      setRenameTarget(null)
    },
    onError: (err) => toast.error(serverError(err, "Failed to rename fuel type.")),
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
      <CardHeader className="flex flex-row items-start justify-between gap-3">
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
        <Button onClick={() => setAddOpen(true)} className="shrink-0">
          <IconPlus className="me-1 size-4" />
          Add fuel type
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">Loading…</p>
        ) : fuelTypes.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            No fuel types yet. Add one to get started.
          </p>
        ) : (
          <Table>
            <TableHeader className="bg-muted/60 [&_th]:font-semibold [&_th]:text-foreground">
              <TableRow className="hover:bg-muted/60 [&_th:first-child]:ps-6 [&_th:last-child]:pe-6">
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanks</TableHead>
                <TableHead>Sellable</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:nth-child(even)]:bg-muted/30 [&_td:first-child]:ps-6 [&_td:last-child]:pe-6">
              {fuelTypes.map((ft) => (
                <TableRow
                  key={ft.id}
                  data-inactive={!ft.isActive}
                  className="data-[inactive=true]:text-muted-foreground"
                >
                  <TableCell className="font-medium">{ft.name}</TableCell>
                  <TableCell>{ft.unit}</TableCell>
                  <TableCell>
                    {ft.isCustom ? (
                      <Badge className="border-transparent bg-primary/10 text-primary hover:bg-primary/10">
                        Custom
                      </Badge>
                    ) : (
                      <Badge variant="outline">OMC</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {ft.isActive ? (
                      <Badge className="border-transparent bg-success/10 text-success hover:bg-success/10">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="border-transparent bg-destructive/10 text-destructive hover:bg-destructive/10">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{ft.tankCount}</TableCell>
                  <TableCell>
                    {ft.isSellable ? (
                      <Badge className="border-transparent bg-success/10 text-success hover:bg-success/10">
                        Sellable
                      </Badge>
                    ) : (
                      <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
                        Not yet sellable
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRenameTarget(ft)}
                      >
                        <IconPencil className="me-1 size-4" />
                        Rename
                      </Button>
                      {ft.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBlockReferences(null)
                            setDeactivateTarget(ft)
                          }}
                        >
                          <IconToggleLeft className="me-1 size-4" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={activeMutation.isPending}
                          onClick={() => activeMutation.mutate({ id: ft.id, isActive: true })}
                        >
                          <IconToggleRight className="me-1 size-4" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AddFuelTypeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        omcFuelTypes={omcFuelTypes}
        existing={fuelTypes}
        isPending={createMutation.isPending}
        onAdd={(payload) => createMutation.mutate(payload)}
      />

      <RenameFuelTypeDialog
        target={renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
        isPending={renameMutation.isPending}
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
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  omcFuelTypes: OMCFuelTypeDto[]
  existing: FuelTypeDto[]
  isPending: boolean
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

  // Reset to a clean form whenever the dialog closes so reopening is fresh.
  useEffect(() => {
    if (!open) {
      setOmcChoiceId("")
      setName("")
      setUnit("L")
      setTab(hasOmcAvailable ? "omc" : "custom")
    }
  }, [open, hasOmcAvailable])

  const submitOmc = () => {
    const choice = availableOmc.find((o) => o.id === omcChoiceId)
    if (!choice) {
      toast.error("Pick a fuel type from your OMC catalog.")
      return
    }
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
      toast.error(parsed.error.issues[0].message)
      return
    }
    const n = parsed.data
    if (existingNames.has(n.toLowerCase())) {
      toast.error("A fuel type with this name already exists.")
      return
    }
    onAdd({ name: n, unit, isCustom: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add fuel type</DialogTitle>
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
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Diesel Premium"
                className="w-full"
              />
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
  onOpenChange,
  isPending,
  onRename,
}: {
  target: FuelTypeDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onRename: (name: string) => void
}) {
  const isOmc = target ? !target.isCustom : false
  const [name, setName] = useState("")

  // Seed / reset the name field whenever a new target is opened.
  useEffect(() => {
    if (target) setName(target.name)
    else setName("")
  }, [target?.id])

  const trimmed = name.trim()
  const unchanged = !!target && trimmed === target.name.trim()

  const handleSave = () => {
    const parsed = fuelTypeNameSchema.safeParse(name)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    onRename(parsed.data)
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
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
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        <DialogFooter>
          {isOmc ? (
            <DialogClose asChild>
              <Button className="h-10 w-full text-sm font-semibold sm:w-auto">
                Close
              </Button>
            </DialogClose>
          ) : (
            <>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleSave}
                disabled={isPending || !trimmed || unchanged}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            </>
          )}
        </DialogFooter>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate {target?.name}?</DialogTitle>
          <DialogDescription>
            Deactivated fuel types are hidden from new price, tank, and nozzle pickers
            but kept for historical reporting.
          </DialogDescription>
        </DialogHeader>

        {blocked && (
          <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
            <IconAlertTriangle className="size-4" />
            <AlertDescription>
              Can&apos;t deactivate — still in use by {references!.join(" and ")}. Remove
              those references first.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{blocked ? "Close" : "Cancel"}</Button>
          </DialogClose>
          {!blocked && (
            <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
              {isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
