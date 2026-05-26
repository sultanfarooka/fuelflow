import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getFuelTanksByStation } from "@/lib/api/stations/fuel-tanks"
import {
  createFuelNozzle,
  deleteFuelNozzle,
  getFuelNozzlesByStation,
  type FuelNozzleDto,
} from "@/lib/api/stations/fuel-nozzles"

interface Props {
  stationId: string
  onNext: () => void
  onBack: () => void
}

export function StepNozzles({ stationId, onNext, onBack }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [nozzleNumber, setNozzleNumber] = useState("")
  const [tankId, setTankId] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: tanksRes } = useQuery({
    queryKey: ["fuel-tanks", stationId],
    queryFn: () => getFuelTanksByStation(stationId),
  })
  const tanks = tanksRes?.data ?? []

  const { data: nozzlesRes } = useQuery({
    queryKey: ["fuel-nozzles", stationId],
    queryFn: () => getFuelNozzlesByStation(stationId),
  })
  const nozzles: FuelNozzleDto[] = nozzlesRes?.data ?? []

  const createMutation = useMutation({
    mutationFn: () =>
      createFuelNozzle(stationId, { nozzleNumber, tankId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-nozzles", stationId] })
      setNozzleNumber("")
      setTankId("")
      toast.success(t("onboarding.step5.nozzleAdded"))
    },
    onError: () => toast.error(t("onboarding.step5.addError")),
  })

  const deleteMutation = useMutation({
    mutationFn: (nozzleId: string) => deleteFuelNozzle(stationId, nozzleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fuel-nozzles", stationId] }),
    onError: () => toast.error(t("onboarding.step5.deleteError")),
  })

  const canAdd = nozzleNumber.trim() && tankId

  const handleNext = () => {
    if (nozzles.length === 0) {
      setValidationError(t("onboarding.step5.validationError"))
      return
    }
    setValidationError(null)
    onNext()
  }

  const getTankName = (id: string) =>
    tanks.find((t) => t.id === id)?.name ?? id.slice(0, 8)

  return (
    <div className="space-y-6">
      {nozzles.length > 0 && (
        <div className="space-y-2">
          {nozzles.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between rounded-xl border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium">{t("onboarding.step5.nozzleLabel", { number: n.nozzleNumber })}</p>
                <p className="text-xs text-muted-foreground">
                  {t("onboarding.step5.tankLabel", { name: getTankName(n.tankId) })}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(n.id)}
                aria-label="Delete nozzle"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Card size="sm">
        <CardContent className="pt-4">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="nozzle-number">{t("onboarding.step5.nozzleNumber")}</FieldLabel>
                <Input
                  id="nozzle-number"
                  type="number"
                  inputMode="numeric"
                  value={nozzleNumber}
                  onChange={(e) => setNozzleNumber(e.target.value)}
                  placeholder="e.g. 1"
                  min={1}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="nozzle-tank">{t("onboarding.step5.linkedTank")}</FieldLabel>
                <Select value={tankId} onValueChange={setTankId}>
                  <SelectTrigger id="nozzle-tank" className="w-full">
                    <SelectValue placeholder={t("onboarding.step5.selectTank")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tanks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name ?? `Tank ${t.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => createMutation.mutate()}
              disabled={!canAdd || createMutation.isPending}
            >
              <Plus className="me-2 size-4" />
              {createMutation.isPending ? t("onboarding.step5.adding") : t("onboarding.step5.addNozzle")}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

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
