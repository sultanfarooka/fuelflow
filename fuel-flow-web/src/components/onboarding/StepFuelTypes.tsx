import { useState } from "react"
import { ChevronDown, Plus } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getOMCFuelTypesByOmc } from "@/lib/api/omc-fuel-types"
import {
  createFuelType,
  deleteFuelType,
  getFuelTypesByStation,
  type FuelTypeDto,
} from "@/lib/api/stations"

const formFieldClass = "h-10 text-sm"
const formLabelClass = "text-sm"
const formSelectClass = "h-10 w-full text-sm"

interface Props {
  stationId: string
  omcId: string
  onNext: () => void
  onBack: () => void
}

function formatUnit(unit: string, t: (key: string) => string) {
  if (unit === "L") return t("onboarding.step2.litres")
  if (unit === "kg") return t("onboarding.step2.kilograms")
  return unit
}

export function StepFuelTypes({ stationId, omcId, onNext, onBack }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [customName, setCustomName] = useState("")
  const [customUnit, setCustomUnit] = useState("L")
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: stationTypesRes, isLoading: stationTypesLoading } = useQuery({
    queryKey: ["fuel-types", stationId],
    queryFn: () => getFuelTypesByStation(stationId),
  })
  const stationTypes: FuelTypeDto[] = stationTypesRes?.data ?? []

  const { data: omcTypesRes, isLoading: omcTypesLoading } = useQuery({
    queryKey: ["omc-fuel-types", omcId],
    queryFn: () => getOMCFuelTypesByOmc(omcId),
    enabled: !!omcId,
  })
  const omcTypes = omcTypesRes?.data ?? []

  const addMutation = useMutation({
    mutationFn: (payload: { name: string; unit: string; omcId?: string; isCustom: boolean }) =>
      createFuelType(stationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-types", stationId] })
    },
    onError: () => toast.error(t("onboarding.step2.addError")),
  })

  const removeMutation = useMutation({
    mutationFn: (fuelTypeId: string) => deleteFuelType(stationId, fuelTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-types", stationId] })
    },
    onError: () => toast.error(t("onboarding.step2.removeError")),
  })

  const isPending = addMutation.isPending || removeMutation.isPending

  const customStationTypes = stationTypes.filter(
    (st) => st.isCustom || !omcTypes.some((ot) => ot.name === st.name)
  )

  const findStationTypeByName = (name: string) => stationTypes.find((st) => st.name === name)

  const handleOmcCheckedChange = async (
    omcType: { id?: string; name: string; unit: string },
    checked: boolean
  ) => {
    const existing = findStationTypeByName(omcType.name)
    if (checked) {
      if (existing) return
      await addMutation.mutateAsync({
        name: omcType.name,
        unit: omcType.unit,
        omcId,
        isCustom: false,
      })
    } else if (existing) {
      await removeMutation.mutateAsync(existing.id)
    }
  }

  const handleCustomCheckedChange = async (fuelType: FuelTypeDto, checked: boolean) => {
    if (!checked) {
      await removeMutation.mutateAsync(fuelType.id)
    }
  }

  const handleAddCustom = async () => {
    const name = customName.trim()
    if (!name) return
    if (findStationTypeByName(name)) {
      toast.error(t("onboarding.step2.duplicateName"))
      return
    }
    await addMutation.mutateAsync({ name, unit: customUnit, isCustom: true })
    setCustomName("")
    setCustomUnit("L")
    setShowCustomForm(false)
  }

  const handleNext = () => {
    if (stationTypes.length === 0) {
      setValidationError(t("onboarding.step2.validationError"))
      return
    }
    setValidationError(null)
    onNext()
  }

  const omcName = omcTypes[0]?.omcName ?? "OMC"
  const isLoading = stationTypesLoading || omcTypesLoading
  const canContinue = stationTypes.length > 0 && !isPending

  return (
    <div className="space-y-6">
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("onboarding.step2.omcProducts", { omcName })}</CardTitle>
          <CardDescription>{t("onboarding.step2.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <p className="text-sm text-muted-foreground">{t("onboarding.step2.loading")}</p>
          )}

          {!isLoading && omcTypes.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("onboarding.step2.noOmcProducts")}</p>
          )}

          {!isLoading && omcTypes.length > 0 && (
            <div className="space-y-2" role="group" aria-label={t("onboarding.step2.omcProducts", { omcName })}>
              {omcTypes.map((ot) => {
                const isChecked = !!findStationTypeByName(ot.name)
                const rowId = `fuel-omc-${ot.id}`
                return (
                  <div
                    key={ot.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border p-3 transition-colors",
                      isChecked && "border-primary/30 bg-primary/5"
                    )}
                  >
                    <Checkbox
                      id={rowId}
                      checked={isChecked}
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        handleOmcCheckedChange(ot, checked === true)
                      }
                    />
                    <Label htmlFor={rowId} className="flex flex-1 cursor-pointer items-center justify-between gap-2 font-normal">
                      <span className="text-sm font-medium">{ot.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatUnit(ot.unit, t)}
                      </span>
                    </Label>
                  </div>
                )
              })}
            </div>
          )}

          {!isLoading && customStationTypes.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-sm font-medium">{t("onboarding.step2.customSectionTitle")}</p>
              {customStationTypes.map((ft) => {
                const rowId = `fuel-custom-${ft.id}`
                return (
                  <div
                    key={ft.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <Checkbox
                      id={rowId}
                      checked
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        handleCustomCheckedChange(ft, checked === true)
                      }
                    />
                    <Label htmlFor={rowId} className="flex flex-1 cursor-pointer items-center justify-between gap-2 font-normal">
                      <span className="text-sm font-medium">{ft.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatUnit(ft.unit, t)}
                      </span>
                    </Label>
                  </div>
                )
              })}
            </div>
          )}

          <div className="border-t border-border pt-4">
            {!showCustomForm ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start gap-2 px-0 text-primary hover:bg-transparent hover:text-primary/90"
                onClick={() => setShowCustomForm(true)}
              >
                <Plus className="size-4" />
                {t("onboarding.step2.customNotListed")}
                <ChevronDown className="ms-auto size-4 opacity-60" />
              </Button>
            ) : (
              <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                <p className="text-sm font-medium">{t("onboarding.step2.customTitle")}</p>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="custom-name" className={formLabelClass}>
                      {t("onboarding.step2.customName")}
                    </FieldLabel>
                    <Input
                      id="custom-name"
                      className={formFieldClass}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. LPG"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="custom-unit" className={formLabelClass}>
                      {t("onboarding.step2.customUnit")}
                    </FieldLabel>
                    <Select value={customUnit} onValueChange={setCustomUnit}>
                      <SelectTrigger id="custom-unit" className={formSelectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">{t("onboarding.step2.litres")}</SelectItem>
                        <SelectItem value="kg">{t("onboarding.step2.kilograms")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("flex-1", formFieldClass)}
                      onClick={() => {
                        setShowCustomForm(false)
                        setCustomName("")
                      }}
                    >
                      {t("onboarding.actions.cancel")}
                    </Button>
                    <Button
                      type="button"
                      className={cn("flex-1", formFieldClass)}
                      onClick={handleAddCustom}
                      disabled={!customName.trim() || isPending}
                    >
                      <Plus className="me-2 size-4" />
                      {t("onboarding.step2.addCustom")}
                    </Button>
                  </div>
                </FieldGroup>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t border-border">
          <p
            className={cn(
              "text-sm",
              stationTypes.length === 0 ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {stationTypes.length === 0
              ? t("onboarding.step2.emptySelection")
              : t("onboarding.step2.selectedCount", {
                  count: stationTypes.length,
                })}
          </p>
        </CardFooter>
      </Card>

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="h-10 px-4 text-sm">
          {t("onboarding.actions.back")}
        </Button>
        <Button type="button" onClick={handleNext} disabled={!canContinue} className="h-10 px-4 text-sm">
          {t("onboarding.actions.continue")}
        </Button>
      </div>
    </div>
  )
}
