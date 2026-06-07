import { useRef, useState } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, Plus, Trash2, Upload, X } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  createFuelTank,
  deleteFuelTank,
  getFuelTanksByStation,
  type FuelTankDto,
} from "@/lib/api/stations/fuel-tanks"
import { getFuelTypesByStation } from "@/lib/api/stations/fuel-types"
import { getDipChart, uploadDipChart, type UploadDipChartEntry } from "@/lib/api/stations/dip-chart"


interface Props {
  stationId: string
  onNext: () => void
  onBack: () => void
}

function parseCsv(text: string): UploadDipChartEntry[] | null {
  const lines = text.trim().split("\n")
  const entries: UploadDipChartEntry[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const parts = trimmed.split(",").map((s) => s.trim())
    if (parts.length < 2) continue
    const depthCm = parseFloat(parts[0])
    const volumeLiters = parseFloat(parts[1])
    if (isNaN(depthCm) || isNaN(volumeLiters)) continue
    entries.push({ depthCm, volumeLiters })
  }
  return entries.length > 0 ? entries : null
}

function TankRow({
  tank,
  stationId,
  fuelTypeName,
  onDelete,
  isDeleting,
}: {
  tank: FuelTankDto
  stationId: string
  fuelTypeName: string
  onDelete: () => void
  isDeleting: boolean
}) {
  const { t } = useTranslation()
  const { data: dipRes } = useQuery({
    queryKey: ["dip-chart", tank.id],
    queryFn: () => getDipChart(stationId, tank.id),
  })
  const entryCount = dipRes?.data?.entries?.length ?? tank.dipChartEntryCount ?? 0

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{tank.name}</p>
        <p className="text-xs text-muted-foreground">
          {fuelTypeName} · {tank.capacityLiters.toLocaleString()} L ·{" "}
          {t("onboarding.step4.dipEntries", { count: entryCount })}
        </p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={t("onboarding.step4.deleteTank")}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("onboarding.step4.deleteTank")}</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function StepTanks({ stationId, onNext, onBack }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [fuelTypeId, setFuelTypeId] = useState("")
  const [tankName, setTankName] = useState("")
  const [capacity, setCapacity] = useState("")
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [pendingEntries, setPendingEntries] = useState<UploadDipChartEntry[] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: typesRes } = useQuery({
    queryKey: ["fuel-types", stationId],
    queryFn: () => getFuelTypesByStation(stationId),
  })
  const fuelTypes = typesRes?.data ?? []

  const { data: tanksRes } = useQuery({
    queryKey: ["fuel-tanks", stationId],
    queryFn: () => getFuelTanksByStation(stationId),
  })
  const tanks: FuelTankDto[] = tanksRes?.data ?? []

  const selectedFuelTypeId =
    fuelTypeId && fuelTypes.some((ft) => ft.id === fuelTypeId)
      ? fuelTypeId
      : (fuelTypes[0]?.id ?? "")

  const effectiveShowAddForm = showAddForm || (tanks.length === 0 && fuelTypes.length > 0)

  const createMutation = useMutation({
    mutationFn: () =>
      createFuelTank(stationId, {
        name: tankName.trim(),
        capacityLiters: parseFloat(capacity),
        fuelTypeId: selectedFuelTypeId,
      }),
    onSuccess: async (res) => {
      const tankId = res.data.id
      if (pendingEntries) {
        await uploadDipChart(stationId, tankId, { entries: pendingEntries })
        queryClient.invalidateQueries({ queryKey: ["dip-chart", tankId] })
      }
      queryClient.invalidateQueries({ queryKey: ["fuel-tanks", stationId] })
      resetAddForm()
      setShowAddForm(false)
      toast.success(t("onboarding.step4.tankAdded"))
    },
    onError: (err: Error) => {
      const msg = err.message || t("onboarding.step4.addError")
      setAddError(msg)
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (tankId: string) => deleteFuelTank(stationId, tankId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fuel-tanks", stationId] }),
    onError: () => toast.error(t("onboarding.step4.deleteError")),
  })

  const resetAddForm = () => {
    setTankName("")
    setCapacity("")
    setPendingEntries(null)
    setCsvFileName(null)
    setCsvError(null)
    setAddError(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const entries = parseCsv(text)
      if (!entries) {
        setCsvError(t("onboarding.step4.csvError"))
        setCsvFileName(null)
        setPendingEntries(null)
      } else {
        setCsvError(null)
        setCsvFileName(file.name)
        setPendingEntries(entries)
        setAddError(null)
      }
    }
    reader.readAsText(file)
  }

  const handleRemoveCsv = () => {
    setPendingEntries(null)
    setCsvFileName(null)
    setCsvError(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const fuelTypeNameById = (id: string) =>
    fuelTypes.find((ft) => ft.id === id)?.name ?? tanks.find((t) => t.fuelTypeId === id)?.fuelTypeName ?? ""

  const coveredFuelTypeCount = fuelTypes.filter((ft) =>
    tanks.some((tank) => tank.fuelTypeId === ft.id)
  ).length
  const allFuelTypesCovered =
    fuelTypes.length > 0 && fuelTypes.every((ft) => tanks.some((t) => t.fuelTypeId === ft.id))
  const isBusy = createMutation.isPending || deleteMutation.isPending

  const handleAddTank = () => {
    if (!tankName.trim()) {
      setAddError(t("onboarding.step4.errorNameRequired"))
      return
    }
    const cap = parseFloat(capacity)
    if (!capacity || isNaN(cap) || cap <= 0) {
      setAddError(t("onboarding.step4.errorCapacityRequired"))
      return
    }
    if (!pendingEntries) {
      setAddError(t("onboarding.step4.errorCsvRequired"))
      return
    }
    setAddError(null)
    createMutation.mutate()
  }

  const handleOpenAddForm = () => {
    setAddError(null)
    setCsvError(null)
    setValidationError(null)
    setShowAddForm(true)
  }

  const handleNext = () => {
    if (!allFuelTypesCovered) {
      setValidationError(t("onboarding.step4.validationError"))
      return
    }
    setValidationError(null)
    onNext()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("onboarding.steps.4.title")}</CardTitle>
          <CardDescription>{t("onboarding.step4.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fuelTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("onboarding.step4.noFuelTypes")}</p>
          ) : (
            <>
              {tanks.length > 0 && (
                <div className="space-y-2" role="list" aria-label={t("onboarding.step4.tankList")}>
                  {tanks.map((tank) => (
                    <TankRow
                      key={tank.id}
                      tank={tank}
                      stationId={stationId}
                      fuelTypeName={fuelTypeNameById(tank.fuelTypeId)}
                      onDelete={() => deleteMutation.mutate(tank.id)}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              )}

              {tanks.length === 0 && !showAddForm && (
                <p className="text-sm text-muted-foreground">{t("onboarding.step4.emptyTanks")}</p>
              )}

              <div className={cn(tanks.length > 0 && "border-t border-border pt-4")}>
                {!effectiveShowAddForm ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2 px-0 text-primary hover:bg-transparent hover:text-primary/90"
                    onClick={handleOpenAddForm}
                  >
                    <Plus className="size-4" />
                    {t("onboarding.step4.addTankAction")}
                    <ChevronDown className="ms-auto size-4 opacity-60" />
                  </Button>
                ) : (
                  <div className="space-y-4 rounded-lg border border-dashed border-border p-4 text-sm">
                    <p className="font-medium">{t("onboarding.step4.addTankFormTitle")}</p>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="tank-fuel-type">
                          {t("onboarding.step4.fuelType")}
                        </FieldLabel>
                        <Select value={selectedFuelTypeId} onValueChange={setFuelTypeId}>
                          <SelectTrigger id="tank-fuel-type">
                            <SelectValue placeholder={t("onboarding.step4.selectFuelType")} />
                          </SelectTrigger>
                          <SelectContent>
                            {fuelTypes.map((ft) => (
                              <SelectItem key={ft.id} value={ft.id}>
                                {ft.name} ({ft.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="tank-name">
                            {t("onboarding.step4.tankName")}
                          </FieldLabel>
                          <Input
                            id="tank-name"
                            size="lg"
                            value={tankName}
                            onChange={(e) => { setTankName(e.target.value); setAddError(null) }}
                            placeholder="e.g. Tank 1"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="tank-capacity">
                            {t("onboarding.step4.capacity")}
                          </FieldLabel>
                          <Input
                            id="tank-capacity"
                            size="lg"
                            type="number"
                            inputMode="numeric"
                            value={capacity}
                            onChange={(e) => { setCapacity(e.target.value); setAddError(null) }}
                            placeholder="e.g. 10000"
                            min={1}
                          />
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="dip-csv">
                          {t("onboarding.step4.dipCsvLabel")}
                        </FieldLabel>
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileRef}
                            id="dip-csv"
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          {pendingEntries && csvFileName ? (
                            <div className="flex h-10 flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm">
                              <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                              <span className="min-w-0 flex-1 truncate text-foreground">{csvFileName}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {t("onboarding.step4.rowsLoaded", { count: pendingEntries.length })}
                              </span>
                              <button
                                type="button"
                                onClick={handleRemoveCsv}
                                className="ms-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                                aria-label="Remove CSV"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => fileRef.current?.click()}
                            >
                              <Upload className="me-1.5 size-4" />
                              {t("onboarding.step4.uploadCsv")}
                            </Button>
                          )}
                        </div>
                        {csvError && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="size-4" />
                            <AlertDescription>{csvError}</AlertDescription>
                          </Alert>
                        )}
                        {addError && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="size-4" />
                            <AlertDescription>{addError}</AlertDescription>
                          </Alert>
                        )}
                        <p className="text-xs text-muted-foreground">{t("onboarding.step4.csvHint")}</p>
                      </Field>

                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="flex-1"
                          onClick={() => {
                            setShowAddForm(false)
                            resetAddForm()
                          }}
                        >
                          {t("onboarding.actions.cancel")}
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          className="flex-1"
                          onClick={handleAddTank}
                          disabled={createMutation.isPending}
                        >
                          {createMutation.isPending
                            ? t("onboarding.step4.adding")
                            : t("onboarding.step4.addTank")}
                        </Button>
                      </div>
                    </FieldGroup>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        {fuelTypes.length > 0 && (
          <CardFooter className="border-t border-border">
            <p
              className={cn(
                "text-sm",
                coveredFuelTypeCount === 0 ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {coveredFuelTypeCount === 0
                ? t("onboarding.step4.emptyCoverage")
                : t("onboarding.step4.coverageProgress", {
                    covered: coveredFuelTypeCount,
                    total: fuelTypes.length,
                  })}
            </p>
          </CardFooter>
        )}
      </Card>

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          {t("onboarding.actions.back")}
        </Button>
        <Button type="button" size="lg" onClick={handleNext} disabled={isBusy}>
          {t("onboarding.actions.continue")}
        </Button>
      </div>
    </div>
  )
}
