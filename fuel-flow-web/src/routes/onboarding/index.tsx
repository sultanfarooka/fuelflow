import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StepOrgStation } from "@/components/onboarding/StepOrgStation"
import { StepFuelTypes } from "@/components/onboarding/StepFuelTypes"
import { StepPrices } from "@/components/onboarding/StepPrices"
import { StepTanks } from "@/components/onboarding/StepTanks"
import { StepNozzles } from "@/components/onboarding/StepNozzles"
import { StepOperations } from "@/components/onboarding/StepOperations"
import { StepBankAccount } from "@/components/onboarding/StepBankAccount"
import { StepInviteManager } from "@/components/onboarding/StepInviteManager"
import { StepSummary } from "@/components/onboarding/StepSummary"
import { getFuelTypesByStation } from "@/lib/api/stations/fuel-types"
import { getFuelPricesByStation } from "@/lib/api/stations/fuel-prices"
import { getFuelTanksByStation } from "@/lib/api/stations/fuel-tanks"
import { getFuelNozzlesByStation } from "@/lib/api/stations/fuel-nozzles"
import { getShiftConfig } from "@/lib/api/stations/shift-config"
import { getCurrentUser } from "@/lib/api/auth"
import { getStationsByOrganization } from "@/lib/api/station-management"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"

const TOTAL_STEPS = 9

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingWizard,
})

async function computeResumeStep(stationId: string): Promise<number> {
  const [typesRes, pricesRes, tanksRes, nozzlesRes, shiftRes] = await Promise.all([
    getFuelTypesByStation(stationId).catch(() => ({ data: [] })),
    getFuelPricesByStation(stationId).catch(() => ({ data: [] })),
    getFuelTanksByStation(stationId).catch(() => ({ data: [] })),
    getFuelNozzlesByStation(stationId).catch(() => ({ data: [] })),
    getShiftConfig(stationId).catch(() => null),
  ])

  const types = typesRes.data ?? []
  if (types.length === 0) return 2

  const prices = pricesRes.data ?? []
  const allPriced = types.every((ft) => prices.some((p) => p.fuelTypeId === ft.id))
  if (!allPriced) return 3

  const tanks = tanksRes.data ?? []
  const allTanked = types.every((ft) => tanks.some((t) => t.fuelTypeId === ft.id))
  if (!allTanked) return 4

  const nozzles = nozzlesRes.data ?? []
  if (nozzles.length === 0) return 5

  if (!shiftRes?.data) return 6

  // All required steps done → land on first optional step
  return 7
}

function OnboardingWizard() {
  const { t } = useTranslation()
  const { organization, stations, isAuthenticated, setAuthState } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [stationId, setStationId] = useState<string | null>(
    stations?.[0]?.id ?? null
  )
  const [omcId, setOmcId] = useState<string | null>(null)
  const [isResuming, setIsResuming] = useState(false)

  // Refresh auth from server when local store is missing org (e.g. stale localStorage)
  useEffect(() => {
    if (!isAuthenticated || organization) return
    getCurrentUser()
      .then((res) => {
        if (res.data) setAuthState(res.data)
      })
      .catch(() => {})
  }, [isAuthenticated, organization, setAuthState])

  // Resume: org/station may already exist in auth store after step 1 — still compute step
  useEffect(() => {
    if (!organization) return

    let cancelled = false
    setIsResuming(true)

    ;(async () => {
      try {
        let resolvedStationId = stationId
        let resolvedOmcId = omcId

        const res = await getStationsByOrganization(organization.id)
        const stationsList = res.data ?? []

        if (!resolvedStationId) {
          const station = stationsList[0]
          if (!station) {
            if (!cancelled) setCurrentStep(1)
            return
          }
          resolvedStationId = station.id
          resolvedOmcId = station.omcId
        } else if (!resolvedOmcId) {
          const station = stationsList.find((s) => s.id === resolvedStationId)
          if (station) resolvedOmcId = station.omcId
        }

        if (cancelled) return

        setStationId(resolvedStationId)
        if (resolvedOmcId) setOmcId(resolvedOmcId)

        const step = await computeResumeStep(resolvedStationId)
        if (!cancelled) setCurrentStep(step)
      } catch {
        if (!cancelled) setCurrentStep(1)
      } finally {
        if (!cancelled) setIsResuming(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [organization?.id])

  const goTo = (step: number) => setCurrentStep(step)
  const goNext = () => setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS))
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1))

  if (isResuming) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">{t("onboarding.resuming")}</p>
      </div>
    )
  }

  return (
    <div className="bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Progress bar */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("onboarding.progress", { current: currentStep, total: TOTAL_STEPS })}
          </p>
          <div className="hidden gap-1 sm:flex">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const step = i + 1
              const isComplete = step < currentStep
              const isActive = step === currentStep
              return (
                <div
                  key={step}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    isComplete && "bg-primary",
                    isActive && "animate-pulse bg-primary/70",
                    !isComplete && !isActive && "bg-muted"
                  )}
                />
              )
            })}
          </div>
          {/* Mobile: simple progress bar */}
          <div className="sm:hidden">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {currentStep}
            </span>
            <h1 className="text-lg font-semibold">{t(`onboarding.steps.${currentStep}.title`)}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t(`onboarding.steps.${currentStep}.description`)}</p>
        </div>

        {/* Step content */}
        <div>
          {currentStep === 1 && (
            <StepOrgStation
              onNext={(sid, oid) => {
                setStationId(sid)
                setOmcId(oid)
                goTo(2)
              }}
            />
          )}

          {currentStep === 2 && stationId && (
            <StepFuelTypes
              stationId={stationId}
              omcId={omcId ?? ""}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {currentStep === 3 && stationId && (
            <StepPrices stationId={stationId} onNext={goNext} onBack={goBack} />
          )}

          {currentStep === 4 && stationId && (
            <StepTanks stationId={stationId} onNext={goNext} onBack={goBack} />
          )}

          {currentStep === 5 && stationId && (
            <StepNozzles stationId={stationId} onNext={goNext} onBack={goBack} />
          )}

          {currentStep === 6 && stationId && (
            <StepOperations stationId={stationId} onNext={goNext} onBack={goBack} />
          )}

          {currentStep === 7 && (
            <StepBankAccount onNext={goNext} onBack={goBack} onSkip={goNext} />
          )}

          {currentStep === 8 && (
            <StepInviteManager onNext={goNext} onBack={goBack} onSkip={goNext} />
          )}

          {currentStep === 9 && stationId && (
            <StepSummary stationId={stationId} onBack={goBack} />
          )}

          {/* Fallback for missing stationId on steps 2-6, 9 */}
          {(currentStep >= 2 && currentStep <= 6 && !stationId) ||
          (currentStep === 9 && !stationId) ? (
            <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
              {t("onboarding.stationNotFound")}
              <button
                type="button"
                onClick={() => goTo(1)}
                className="ms-2 text-primary underline"
              >
                {t("onboarding.backToStart")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
