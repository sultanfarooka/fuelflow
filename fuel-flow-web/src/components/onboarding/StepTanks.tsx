import { useRef, useState } from "react"
import { Plus, Trash2, Upload } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
    const parts = line.split(",").map((s) => s.trim())
    const depthCm = parseFloat(parts[0])
    const volumeLiters = parseFloat(parts[1])
    if (isNaN(depthCm) || isNaN(volumeLiters)) return null
    entries.push({ depthCm, volumeLiters })
  }
  return entries.length > 0 ? entries : null
}

function TankCard({
  tank,
  stationId,
  onDelete,
}: {
  tank: FuelTankDto
  stationId: string
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const { data: dipRes } = useQuery({
    queryKey: ["dip-chart", tank.id],
    queryFn: () => getDipChart(stationId, tank.id),
  })
  const entryCount = dipRes?.data?.entries?.length ?? 0

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">{tank.name}</p>
        <p className="text-xs text-muted-foreground">
          {tank.capacityLiters.toLocaleString()} L · {t("onboarding.step4.dipEntries", { count: entryCount })}
        </p>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onDelete} aria-label="Delete tank">
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  )
}

function FuelTypeSection({
  fuelTypeId,
  fuelTypeName,
  stationId,
}: {
  fuelTypeId: string
  fuelTypeName: string
  stationId: string
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tankName, setTankName] = useState("")
  const [capacity, setCapacity] = useState("")
  const [csvError, setCsvError] = useState<string | null>(null)
  const [pendingEntries, setPendingEntries] = useState<UploadDipChartEntry[] | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(true)

  const { data: tanksRes } = useQuery({
    queryKey: ["fuel-tanks", stationId],
    queryFn: () => getFuelTanksByStation(stationId),
  })
  const typeTanks = (tanksRes?.data ?? []).filter((t) => t.fuelTypeId === fuelTypeId)

  const createMutation = useMutation({
    mutationFn: () =>
      createFuelTank(stationId, {
        name: tankName.trim(),
        capacityLiters: parseFloat(capacity),
        fuelTypeId,
      }),
    onSuccess: async (res) => {
      const tankId = res.data.id
      if (pendingEntries) {
        await uploadDipChart(stationId, tankId, { entries: pendingEntries })
        queryClient.invalidateQueries({ queryKey: ["dip-chart", tankId] })
      }
      queryClient.invalidateQueries({ queryKey: ["fuel-tanks", stationId] })
      setTankName("")
      setCapacity("")
      setPendingEntries(null)
      setCsvError(null)
      if (fileRef.current) fileRef.current.value = ""
      setIsFormOpen(false)
      toast.success(t("onboarding.step4.tankAdded"))
    },
    onError: () => toast.error(t("onboarding.step4.addError")),
  })

  const deleteMutation = useMutation({
    mutationFn: (tankId: string) => deleteFuelTank(stationId, tankId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fuel-tanks", stationId] }),
    onError: () => toast.error(t("onboarding.step4.deleteError")),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const entries = parseCsv(text)
      if (!entries) {
        setCsvError(t("onboarding.step4.csvError"))
        setPendingEntries(null)
      } else {
        setCsvError(null)
        setPendingEntries(entries)
      }
    }
    reader.readAsText(file)
  }

  const canAdd = tankName.trim() && capacity && !isNaN(parseFloat(capacity)) && pendingEntries

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{fuelTypeName}</CardTitle>
          {typeTanks.length > 0 && !isFormOpen && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="me-1 size-3.5" />
              {t("onboarding.step4.addAnother")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {typeTanks.map((tank) => (
          <TankCard
            key={tank.id}
            tank={tank}
            stationId={stationId}
            onDelete={() => deleteMutation.mutate(tank.id)}
          />
        ))}

        {(isFormOpen || typeTanks.length === 0) && (
          <FieldGroup className="rounded-lg bg-muted/40 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`tank-name-${fuelTypeId}`}>{t("onboarding.step4.tankName")}</FieldLabel>
                <Input
                  id={`tank-name-${fuelTypeId}`}
                  value={tankName}
                  onChange={(e) => setTankName(e.target.value)}
                  placeholder="e.g. Tank 1"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`tank-cap-${fuelTypeId}`}>{t("onboarding.step4.capacity")}</FieldLabel>
                <Input
                  id={`tank-cap-${fuelTypeId}`}
                  type="number"
                  inputMode="numeric"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 10000"
                  min={1}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor={`dip-csv-${fuelTypeId}`}>
                {t("onboarding.step4.dipCsvLabel")}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  id={`dip-csv-${fuelTypeId}`}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="me-1.5 size-3.5" />
                  {pendingEntries
                    ? t("onboarding.step4.rowsLoaded", { count: pendingEntries.length })
                    : t("onboarding.step4.uploadCsv")}
                </Button>
              </div>
              {csvError && (
                <Alert variant="destructive" className="mt-1">
                  <AlertDescription>{csvError}</AlertDescription>
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                {t("onboarding.step4.csvHint")}
              </p>
            </Field>

            <Button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!canAdd || createMutation.isPending}
              size="sm"
            >
              {createMutation.isPending ? t("onboarding.step4.adding") : t("onboarding.step4.addTank")}
            </Button>
          </FieldGroup>
        )}
      </CardContent>
    </Card>
  )
}

export function StepTanks({ stationId, onNext, onBack }: Props) {
  const { t } = useTranslation()
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

  const handleNext = () => {
    const allCovered = fuelTypes.every((ft) => tanks.some((t) => t.fuelTypeId === ft.id))
    if (!allCovered) {
      setValidationError(t("onboarding.step4.validationError"))
      return
    }
    setValidationError(null)
    onNext()
  }

  return (
    <div className="space-y-6">
      {fuelTypes.map((ft) => (
        <FuelTypeSection
          key={ft.id}
          fuelTypeId={ft.id}
          fuelTypeName={ft.name}
          stationId={stationId}
        />
      ))}

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("onboarding.actions.back")}
        </Button>
        <Button type="button" onClick={handleNext}>
          {t("onboarding.actions.continue")}
        </Button>
      </div>
    </div>
  )
}
