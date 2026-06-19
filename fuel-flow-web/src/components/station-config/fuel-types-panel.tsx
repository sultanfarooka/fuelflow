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
    <Card>
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

      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : fuelTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No fuel types yet. Add one to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanks</TableHead>
                <TableHead>Sellable</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelTypes.map((ft) => (
                <TableRow key={ft.id} data-inactive={!ft.isActive}>
                  <TableCell className="font-medium">{ft.name}</TableCell>
                  <TableCell>{ft.unit}</TableCell>
                  <TableCell>
                    <Badge variant={ft.isCustom ? "secondary" : "outline"}>
                      {ft.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ft.isActive ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{ft.tankCount}</TableCell>
                  <TableCell>
                    {ft.isSellable ? (
                      <Badge className="bg-success/10 text-success">Sellable</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Not yet sellable
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
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
 * Single-form add dialog. The Name + Unit fields are the only inputs and
 * are used for both Custom and OMC-derived types. Below them, the station's
 * OMC catalog (minus any types already added) appears as click-to-fill rows.
 * Clicking an OMC row populates the fields and remembers the selection; the
 * single "Add fuel type" button then submits as an OMC pick. Typing in the
 * Name field after picking an OMC row demotes the submission back to Custom.
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
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("L")
  const [pickedOmc, setPickedOmc] = useState<OMCFuelTypeDto | null>(null)

  // Reset to a clean form whenever the dialog closes so reopening is fresh.
  useEffect(() => {
    if (!open) {
      setName("")
      setUnit("L")
      setPickedOmc(null)
    }
  }, [open])

  const existingNames = new Set(existing.map((f) => f.name.toLowerCase()))
  const availableOmc = omcFuelTypes.filter((o) => !existingNames.has(o.name.toLowerCase()))

  const handleNameChange = (next: string) => {
    setName(next)
    // Typing a name different from the picked OMC entry demotes to Custom.
    if (pickedOmc && next.trim().toLowerCase() !== pickedOmc.name.toLowerCase()) {
      setPickedOmc(null)
    }
  }

  const handlePickOmc = (choice: OMCFuelTypeDto) => {
    setPickedOmc(choice)
    setName(choice.name)
    setUnit(choice.unit)
  }

  const submit = () => {
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
    // OMC pick still valid only if the name was not edited away from it.
    if (pickedOmc && n.toLowerCase() === pickedOmc.name.toLowerCase()) {
      onAdd({
        name: pickedOmc.name,
        unit: pickedOmc.unit,
        omcId: pickedOmc.omcId,
        isCustom: false,
      })
    } else {
      onAdd({ name: n, unit, isCustom: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add fuel type</DialogTitle>
          <DialogDescription>
            Add one from your OMC catalog or create a custom one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="add-ft-name" className="text-sm font-semibold">
              Name
            </Label>
            <Input
              id="add-ft-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
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
            onClick={submit}
            disabled={isPending}
            className="h-11 w-full text-sm font-semibold"
          >
            {isPending ? "Adding…" : "Add fuel type"}
          </Button>

          {availableOmc.length > 0 && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Or pick from your OMC catalog
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {availableOmc.map((o) => {
                  const selected = pickedOmc?.id === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => handlePickOmc(o)}
                      aria-pressed={selected}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-start outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        selected
                          ? "border-primary/40 bg-primary/5"
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Rename dialog ─────────────────────────────────────────────────────────
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
  const [name, setName] = useState("")

  return (
    <Dialog
      open={!!target}
      onOpenChange={(o) => {
        if (o && target) setName(target.name)
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename fuel type</DialogTitle>
          <DialogDescription>
            Renaming affects only this station; historical records are unchanged.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="rename-ft-name">Name</Label>
          <Input
            id="rename-ft-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              const parsed = fuelTypeNameSchema.safeParse(name)
              if (!parsed.success) {
                toast.error(parsed.error.issues[0].message)
                return
              }
              onRename(parsed.data)
            }}
            disabled={isPending || !name.trim()}
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
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
