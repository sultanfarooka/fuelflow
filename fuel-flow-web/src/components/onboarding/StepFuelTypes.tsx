import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getOMCFuelTypesByOmc } from "@/lib/api/omc-fuel-types"
import {
  createFuelType,
  deleteFuelType,
  getFuelTypesByStation,
  type FuelTypeDto,
} from "@/lib/api/stations"

interface Props {
  stationId: string
  omcId: string
  onNext: () => void
  onBack: () => void
}

export function StepFuelTypes({ stationId, omcId, onNext, onBack }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [customName, setCustomName] = useState("")
  const [customUnit, setCustomUnit] = useState("L")
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: stationTypesRes } = useQuery({
    queryKey: ["fuel-types", stationId],
    queryFn: () => getFuelTypesByStation(stationId),
  })
  const stationTypes: FuelTypeDto[] = stationTypesRes?.data ?? []
  const { data: omcTypesRes } = useQuery({
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

  const handleToggleOmcType = async (omcType: { id?: string; name: string; unit: string }) => {
    const existing = stationTypes.find((t) => t.name === omcType.name)
    if (existing) {
      await removeMutation.mutateAsync(existing.id)
    } else {
      await addMutation.mutateAsync({ name: omcType.name, unit: omcType.unit, omcId, isCustom: false })
    }
  }

  const handleAddCustom = async () => {
    if (!customName.trim()) return
    await addMutation.mutateAsync({ name: customName.trim(), unit: customUnit, isCustom: true })
    setCustomName("")
    setCustomUnit("L")
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

  return (
    <div className="space-y-6">
      {stationTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stationTypes.map((ft) => (
            <Badge key={ft.id} variant="secondary" className="gap-1 pe-1">
              {ft.name}
              <button
                type="button"
                onClick={() => removeMutation.mutate(ft.id)}
                className="ms-1 rounded-full hover:bg-muted-foreground/20"
                aria-label={`Remove ${ft.name}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("onboarding.step2.omcProducts", { omcName })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {omcTypes.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("onboarding.step2.noOmcProducts")}</p>
            )}
            {omcTypes.map((ot) => {
              const isAdded = stationTypes.some((st) => st.name === ot.name)
              return (
                <div
                  key={ot.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{ot.name}</p>
                    <p className="text-xs text-muted-foreground">{ot.unit}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isAdded ? "secondary" : "outline"}
                    onClick={() => handleToggleOmcType(ot)}
                    disabled={addMutation.isPending || removeMutation.isPending}
                  >
                    {isAdded ? (
                      <>
                        <Check className="me-1 size-3.5" />
                        {t("onboarding.step2.added")}
                      </>
                    ) : (
                      <>
                        <Plus className="me-1 size-3.5" />
                        {t("onboarding.step2.add")}
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>{t("onboarding.step2.customTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="custom-name">{t("onboarding.step2.customName")}</FieldLabel>
                <Input
                  id="custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. LPG"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="custom-unit">{t("onboarding.step2.customUnit")}</FieldLabel>
                <Select value={customUnit} onValueChange={setCustomUnit}>
                  <SelectTrigger id="custom-unit" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">{t("onboarding.step2.litres")}</SelectItem>
                    <SelectItem value="kg">{t("onboarding.step2.kilograms")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCustom}
                disabled={!customName.trim() || addMutation.isPending}
                className="w-full"
              >
                <Plus className="me-2 size-4" />
                {t("onboarding.step2.addCustom")}
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

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
