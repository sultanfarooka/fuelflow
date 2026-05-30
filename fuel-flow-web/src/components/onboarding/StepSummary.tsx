import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getFuelTypesByStation } from "@/lib/api/stations/fuel-types"
import { getFuelPricesByStation } from "@/lib/api/stations/fuel-prices"
import { getFuelTanksByStation } from "@/lib/api/stations/fuel-tanks"
import { getFuelNozzlesByStation } from "@/lib/api/stations/fuel-nozzles"
import { getShiftConfig } from "@/lib/api/stations/shift-config"
import { completeStationSetup } from "@/lib/api/stations/complete-setup"
import { getBankAccounts } from "@/lib/api/organizations/bank-accounts"
import { useAuthStore } from "@/stores/auth-store"
import { getCurrentUser } from "@/lib/api/auth"

interface Props {
  stationId: string
  onBack: () => void
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium">{value}</span>
    </div>
  )
}

export function StepSummary({ stationId, onBack }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const organization = useAuthStore((s) => s.organization)
  const setAuthState = useAuthStore((s) => s.setAuthState)

  const { data: typesRes } = useQuery({
    queryKey: ["fuel-types", stationId],
    queryFn: () => getFuelTypesByStation(stationId),
  })
  const fuelTypes = typesRes?.data ?? []

  const { data: pricesRes } = useQuery({
    queryKey: ["fuel-prices", stationId],
    queryFn: () => getFuelPricesByStation(stationId),
  })
  const prices = pricesRes?.data ?? []

  const { data: tanksRes } = useQuery({
    queryKey: ["fuel-tanks", stationId],
    queryFn: () => getFuelTanksByStation(stationId),
  })
  const tanks = tanksRes?.data ?? []

  const { data: nozzlesRes } = useQuery({
    queryKey: ["fuel-nozzles", stationId],
    queryFn: () => getFuelNozzlesByStation(stationId),
  })
  const nozzles = nozzlesRes?.data ?? []

  const { data: shiftRes } = useQuery({
    queryKey: ["shift-config", stationId],
    queryFn: () => getShiftConfig(stationId),
  })
  const shiftConfig = shiftRes?.data

  const { data: bankRes } = useQuery({
    queryKey: ["bank-accounts", organization?.id],
    queryFn: () => getBankAccounts(organization!.id),
    enabled: !!organization?.id,
  })
  const primaryBank = (bankRes?.data ?? []).find((b) => b.isPrimary)

  const completeMutation = useMutation({
    mutationFn: () => completeStationSetup(stationId),
    onSuccess: async (result) => {
      if (!result.success) return // unmet conditions handled below

      // Re-fetch auth state so isSetupComplete flips in the store
      try {
        const me = await getCurrentUser()
        setAuthState(me.data)
      } catch {
        // best-effort; navigate anyway
      }
      toast.success(t("onboarding.step9.successToast"))
      navigate({ to: "/dashboard" })
    },
    onError: () => toast.error(t("onboarding.step9.failedToast")),
  })

  const result = completeMutation.data
  const unmet = result && !result.success ? result.unmetConditions : []

  const formatTime = (t?: string | null) => {
    if (!t) return "—"
    // t is HH:mm:ss from backend TimeSpan, display as HH:mm
    return t.slice(0, 5)
  }

  return (
    <div className="space-y-6">
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("onboarding.step9.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <div className="pb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("onboarding.step9.fuelSection")}
            </p>
            {fuelTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("onboarding.step9.noneAdded")}</p>
            ) : (
              <div className="space-y-1">
                {fuelTypes.map((ft) => {
                  const price = prices.find((p) => p.fuelTypeId === ft.id)
                  return (
                    <SummaryRow
                      key={ft.id}
                      label={ft.name}
                      value={price ? `Rs. ${price.price.toLocaleString()}` : t("onboarding.step9.noPrice")}
                    />
                  )
                })}
              </div>
            )}
          </div>

          <div className="py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("onboarding.step9.tanksSection")}
            </p>
            <SummaryRow
              label={t("onboarding.step9.tanks")}
              value={
                <span className="flex flex-wrap justify-end gap-1">
                  {tanks.length === 0
                    ? t("onboarding.step9.none")
                    : tanks.map((tank) => (
                        <Badge key={tank.id} variant="outline">
                          {tank.name}
                        </Badge>
                      ))}
                </span>
              }
            />
            <SummaryRow label={t("onboarding.step9.nozzles")} value={t("onboarding.step9.nozzleCount", { count: nozzles.length })} />
          </div>

          <div className="py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("onboarding.step9.shiftsSection")}
            </p>
            {!shiftConfig ? (
              <p className="text-sm text-muted-foreground">{t("onboarding.step9.notConfigured")}</p>
            ) : (
              <>
                <SummaryRow label={shiftConfig.shift1Name} value={formatTime(shiftConfig.shift1StartTime)} />
                <SummaryRow label={shiftConfig.shift2Name} value={formatTime(shiftConfig.shift2StartTime)} />
                {shiftConfig.shiftCount === 3 && shiftConfig.shift3Name && (
                  <SummaryRow label={shiftConfig.shift3Name} value={formatTime(shiftConfig.shift3StartTime)} />
                )}
              </>
            )}
          </div>

          <div className="pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("onboarding.step9.extrasSection")}
            </p>
            <SummaryRow
              label={t("onboarding.step9.bankAccount")}
              value={
                primaryBank
                  ? `${primaryBank.bankName} ···${primaryBank.accountNumber.slice(-4)}`
                  : t("onboarding.step9.notAdded")
              }
            />
            <SummaryRow label={t("onboarding.step9.manager")} value={t("onboarding.step9.notInvited")} />
          </div>
        </CardContent>
      </Card>

      {unmet.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>{t("onboarding.step9.incompleteTitle")}</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {unmet.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          className="w-full sm:w-auto"
          size="lg"
        >
          {completeMutation.isPending ? t("onboarding.actions.finishing") : t("onboarding.actions.finishSetup")}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={completeMutation.isPending}>
          {t("onboarding.actions.goBack")}
        </Button>
      </div>
    </div>
  )
}
