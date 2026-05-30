import { useState } from "react"
import { AlertCircle, ChevronDown, Plus, Trash2 } from "lucide-react"
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
import { getFuelTypesByStation } from "@/lib/api/stations/fuel-types"
import { getFuelTanksByStation, type FuelTankDto } from "@/lib/api/stations/fuel-tanks"
import {
  createFuelNozzle,
  deleteFuelNozzle,
  getFuelNozzlesByStation,
  type FuelNozzleDto,
} from "@/lib/api/stations/fuel-nozzles"

const formFieldClass = "h-10 text-sm"
const formLabelClass = "text-sm"
const formSelectClass = "!h-10 min-h-10 w-full text-sm"

interface Props {
  stationId: string
  onNext: () => void
  onBack: () => void
}

function NozzleRow({
  nozzle,
  tankLabel,
  onDelete,
  isDeleting,
}: {
  nozzle: FuelNozzleDto
  tankLabel: string
  onDelete: () => void
  isDeleting: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {t("onboarding.step5.nozzleLabel", { name: nozzle.nozzleNumber })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("onboarding.step5.tankLabel", { name: tankLabel })}
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
            aria-label={t("onboarding.step5.deleteNozzle")}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("onboarding.step5.deleteNozzle")}</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function StepNozzles({ stationId, onNext, onBack }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [showAddForm, setShowAddForm] = useState(false)
  const [nozzleName, setNozzleName] = useState("")
  const [fuelTypeId, setFuelTypeId] = useState("")
  const [tankId, setTankId] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
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

  const { data: nozzlesRes } = useQuery({
    queryKey: ["fuel-nozzles", stationId],
    queryFn: () => getFuelNozzlesByStation(stationId),
  })
  const nozzles: FuelNozzleDto[] = nozzlesRes?.data ?? []

  const selectedFuelTypeId =
    fuelTypeId && fuelTypes.some((ft) => ft.id === fuelTypeId)
      ? fuelTypeId
      : (fuelTypes[0]?.id ?? "")

  const tanksForFuelType = tanks.filter((tank) => tank.fuelTypeId === selectedFuelTypeId)

  const selectedTankId =
    tankId && tanksForFuelType.some((tank) => tank.id === tankId)
      ? tankId
      : (tanksForFuelType[0]?.id ?? "")

  const effectiveShowAddForm =
    showAddForm || (nozzles.length === 0 && tanks.length > 0 && fuelTypes.length > 0)

  const tankHasNozzle = (id: string) => nozzles.some((nozzle) => nozzle.tankId === id)

  const fuelTypeHasNozzle = (ftId: string) =>
    nozzles.some((nozzle) => {
      const tank = tanks.find((item) => item.id === nozzle.tankId)
      return tank?.fuelTypeId === ftId
    })

  const coveredTankCount = tanks.filter((tank) => tankHasNozzle(tank.id)).length
  const coveredFuelTypeCount = fuelTypes.filter((ft) => fuelTypeHasNozzle(ft.id)).length
  const allTanksCovered = tanks.length > 0 && tanks.every((tank) => tankHasNozzle(tank.id))
  const allFuelTypesCovered =
    fuelTypes.length > 0 && fuelTypes.every((ft) => fuelTypeHasNozzle(ft.id))
  const canContinue = allTanksCovered && allFuelTypesCovered

  const resetAddForm = () => {
    setNozzleName("")
    setTankId("")
    setAddError(null)
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createFuelNozzle(stationId, { nozzleNumber: nozzleName.trim(), tankId: selectedTankId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-nozzles", stationId] })
      resetAddForm()
      setShowAddForm(false)
      toast.success(t("onboarding.step5.nozzleAdded"))
    },
    onError: (err: Error) => {
      const msg = err.message || t("onboarding.step5.addError")
      setAddError(msg)
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (nozzleId: string) => deleteFuelNozzle(stationId, nozzleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fuel-nozzles", stationId] }),
    onError: () => toast.error(t("onboarding.step5.deleteError")),
  })

  const isBusy = createMutation.isPending || deleteMutation.isPending
  const canAdd = nozzleName.trim() && selectedTankId

  const getTankLabel = (id: string) => {
    const tank = tanks.find((item) => item.id === id)
    if (!tank) return id.slice(0, 8)
    const name = tank.name ?? `Tank ${id.slice(0, 8)}`
    return tank.fuelTypeName ? `${name} · ${tank.fuelTypeName}` : name
  }

  const handleOpenAddForm = () => {
    setAddError(null)
    setValidationError(null)
    setShowAddForm(true)
  }

  const handleNext = () => {
    if (!canContinue) {
      if (!allTanksCovered && !allFuelTypesCovered) {
        setValidationError(t("onboarding.step5.validationErrorBoth"))
      } else if (!allTanksCovered) {
        setValidationError(t("onboarding.step5.validationErrorTanks"))
      } else {
        setValidationError(t("onboarding.step5.validationErrorFuelTypes"))
      }
      return
    }
    setValidationError(null)
    onNext()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("onboarding.steps.5.title")}</CardTitle>
          <CardDescription>{t("onboarding.step5.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fuelTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("onboarding.step5.noFuelTypes")}</p>
          ) : tanks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("onboarding.step5.noTanks")}</p>
          ) : (
            <>
              {nozzles.length > 0 && (
                <div className="space-y-2" role="list" aria-label={t("onboarding.step5.nozzleList")}>
                  {nozzles.map((nozzle) => (
                    <NozzleRow
                      key={nozzle.id}
                      nozzle={nozzle}
                      tankLabel={getTankLabel(nozzle.tankId)}
                      onDelete={() => deleteMutation.mutate(nozzle.id)}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              )}

              {nozzles.length === 0 && !showAddForm && (
                <p className="text-sm text-muted-foreground">{t("onboarding.step5.emptyNozzles")}</p>
              )}

              <div className={cn(nozzles.length > 0 && "border-t border-border pt-4")}>
                {!effectiveShowAddForm ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2 px-0 text-primary hover:bg-transparent hover:text-primary/90"
                    onClick={handleOpenAddForm}
                  >
                    <Plus className="size-4" />
                    {t("onboarding.step5.addNozzleAction")}
                    <ChevronDown className="ms-auto size-4 opacity-60" />
                  </Button>
                ) : (
                  <div className="space-y-4 rounded-lg border border-dashed border-border p-4 text-sm">
                    <p className="font-medium">{t("onboarding.step5.addNozzleFormTitle")}</p>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="nozzle-fuel-type" className={formLabelClass}>
                          {t("onboarding.step5.fuelType")}
                        </FieldLabel>
                        <Select
                          value={selectedFuelTypeId}
                          onValueChange={(value) => {
                            setFuelTypeId(value)
                            setTankId("")
                          }}
                        >
                          <SelectTrigger id="nozzle-fuel-type" className={formSelectClass}>
                            <SelectValue placeholder={t("onboarding.step5.selectFuelType")} />
                          </SelectTrigger>
                          <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                            {fuelTypes.map((ft) => (
                              <SelectItem key={ft.id} value={ft.id} className="text-sm">
                                {ft.name} ({ft.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="nozzle-tank" className={formLabelClass}>
                          {t("onboarding.step5.linkedTank")}
                        </FieldLabel>
                        {tanksForFuelType.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {t("onboarding.step5.noTanksForFuelType")}
                          </p>
                        ) : (
                          <Select value={selectedTankId} onValueChange={setTankId}>
                            <SelectTrigger id="nozzle-tank" className={formSelectClass}>
                              <SelectValue placeholder={t("onboarding.step5.selectTank")} />
                            </SelectTrigger>
                            <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                              {tanksForFuelType.map((tank) => (
                                <SelectItem key={tank.id} value={tank.id} className="text-sm">
                                  {tank.name ?? `Tank ${tank.id.slice(0, 8)}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="nozzle-name" className={formLabelClass}>
                          {t("onboarding.step5.nozzleName")}
                        </FieldLabel>
                        <Input
                          id="nozzle-name"
                          className={formFieldClass}
                          value={nozzleName}
                          onChange={(e) => setNozzleName(e.target.value)}
                          placeholder="e.g. D1-N1"
                          maxLength={20}
                        />
                        <p className="text-xs text-muted-foreground">{t("onboarding.step5.nozzleNameHint")}</p>
                      </Field>

                      {addError && (
                        <Alert variant="destructive">
                          <AlertCircle className="size-4" />
                          <AlertDescription>{addError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          className={cn("flex-1", formFieldClass)}
                          onClick={() => {
                            setShowAddForm(false)
                            resetAddForm()
                          }}
                        >
                          {t("onboarding.actions.cancel")}
                        </Button>
                        <Button
                          type="button"
                          className={cn("flex-1", formFieldClass)}
                          onClick={() => createMutation.mutate()}
                          disabled={!canAdd || createMutation.isPending}
                        >
                          {createMutation.isPending
                            ? t("onboarding.step5.adding")
                            : t("onboarding.step5.addNozzle")}
                        </Button>
                      </div>
                    </FieldGroup>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        {fuelTypes.length > 0 && tanks.length > 0 && (
          <CardFooter className="border-t border-border">
            <div className="space-y-1">
              <p
                className={cn(
                  "text-sm",
                  coveredTankCount === 0 ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {coveredTankCount === 0
                  ? t("onboarding.step5.emptyTankCoverage")
                  : t("onboarding.step5.tankCoverageProgress", {
                      covered: coveredTankCount,
                      total: tanks.length,
                    })}
              </p>
              <p
                className={cn(
                  "text-sm",
                  coveredFuelTypeCount === 0 ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {coveredFuelTypeCount === 0
                  ? t("onboarding.step5.emptyCoverage")
                  : t("onboarding.step5.coverageProgress", {
                      covered: coveredFuelTypeCount,
                      total: fuelTypes.length,
                    })}
              </p>
            </div>
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
        <Button type="button" variant="outline" onClick={onBack} className="h-10 px-4 text-sm">
          {t("onboarding.actions.back")}
        </Button>
        <Button type="button" onClick={handleNext} disabled={isBusy} className="h-10 px-4 text-sm">
          {t("onboarding.actions.continue")}
        </Button>
      </div>
    </div>
  )
}
