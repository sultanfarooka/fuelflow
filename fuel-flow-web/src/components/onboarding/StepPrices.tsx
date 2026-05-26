import { useState } from "react"
import { Check } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFuelTypesByStation } from "@/lib/api/stations/fuel-types"
import { getFuelPricesByStation, setFuelPrice } from "@/lib/api/stations/fuel-prices"

interface Props {
  stationId: string
  onNext: () => void
  onBack: () => void
}

export function StepPrices({ stationId, onNext, onBack }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: typesRes } = useQuery({
    queryKey: ["fuel-types", stationId],
    queryFn: () => getFuelTypesByStation(stationId),
  })
  const fuelTypes = typesRes?.data ?? []

  const { data: pricesRes } = useQuery({
    queryKey: ["fuel-prices", stationId],
    queryFn: () => getFuelPricesByStation(stationId),
  })
  const existingPrices = pricesRes?.data ?? []

  const [prices, setPrices] = useState<Record<string, string>>({})

  const getInitialPrice = (fuelTypeId: string) => {
    const existing = existingPrices.find((p) => p.fuelTypeId === fuelTypeId)
    return existing ? String(existing.price) : (prices[fuelTypeId] ?? "")
  }

  const priceMutation = useMutation({
    mutationFn: ({ fuelTypeId, price }: { fuelTypeId: string; price: number }) =>
      setFuelPrice(stationId, {
        fuelTypeId,
        price,
        effectiveFrom: new Date().toISOString(),
      }),
    onSuccess: (_, vars) => {
      setSavedIds((prev) => new Set(prev).add(vars.fuelTypeId))
      queryClient.invalidateQueries({ queryKey: ["fuel-prices", stationId] })
    },
    onError: () => toast.error(t("onboarding.step3.saveError")),
  })

  const handleBlur = async (fuelTypeId: string) => {
    const raw = prices[fuelTypeId] ?? getInitialPrice(fuelTypeId)
    const parsed = parseFloat(raw)
    if (!raw || isNaN(parsed) || parsed <= 0) return
    await priceMutation.mutateAsync({ fuelTypeId, price: parsed })
  }

  const handleNext = () => {
    const allSaved = fuelTypes.every(
      (ft) =>
        savedIds.has(ft.id) ||
        existingPrices.some((p) => p.fuelTypeId === ft.id)
    )
    if (!allSaved) {
      setValidationError(t("onboarding.step3.validationError"))
      return
    }
    setValidationError(null)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {fuelTypes.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("onboarding.step3.noFuelTypes")}</p>
        )}
        {fuelTypes.map((ft) => {
          const isSaved =
            savedIds.has(ft.id) || existingPrices.some((p) => p.fuelTypeId === ft.id)
          const currentVal = prices[ft.id] ?? getInitialPrice(ft.id)

          return (
            <div
              key={ft.id}
              className="flex items-center gap-4 rounded-xl border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{ft.name}</p>
                <p className="text-xs text-muted-foreground">{ft.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Rs.</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={currentVal}
                  onChange={(e) =>
                    setPrices((prev) => ({ ...prev, [ft.id]: e.target.value }))
                  }
                  onBlur={() => handleBlur(ft.id)}
                  className="w-28 text-end"
                  min={0}
                />
                {isSaved && (
                  <Check className="size-4 flex-shrink-0 text-success" aria-label="Saved" />
                )}
              </div>
            </div>
          )
        })}
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
