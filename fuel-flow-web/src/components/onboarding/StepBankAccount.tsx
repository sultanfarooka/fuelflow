import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createBankAccount } from "@/lib/api/organizations/bank-accounts"
import { updatePaymentMethods, ALLOWED_PAYMENT_METHODS } from "@/lib/api/stations/payment-methods"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"

interface Props {
  stationId: string
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function StepBankAccount({ stationId, onNext, onBack, onSkip }: Props) {
  const { t } = useTranslation()
  const organization = useAuthStore((s) => s.organization)
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountTitle, setAccountTitle] = useState("")
  const [methods, setMethods] = useState<string[]>(["Cash"])
  const [submitError, setSubmitError] = useState<string | null>(null)

  const bankMutation = useMutation({
    mutationFn: () =>
      createBankAccount(organization!.id, {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountTitle: accountTitle.trim(),
        isPrimary: true,
      }),
  })

  const paymentMutation = useMutation({
    mutationFn: () => updatePaymentMethods(stationId, methods),
  })

  const toggleMethod = (method: string) => {
    if (method === "Cash") return
    setMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    )
  }

  const canSubmit = bankName.trim() && accountNumber.trim() && accountTitle.trim()

  const handleSave = async () => {
    setSubmitError(null)
    try {
      await bankMutation.mutateAsync()
      await paymentMutation.mutateAsync()
      toast.success(t("onboarding.step7.savedToast"))
      onNext()
    } catch {
      setSubmitError(t("onboarding.step7.saveError"))
    }
  }

  const isPending = bankMutation.isPending || paymentMutation.isPending

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("onboarding.step7.hint")}
      </p>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("onboarding.step7.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="bank-name">{t("onboarding.step7.bankName")}</FieldLabel>
              <Input
                id="bank-name"
                size="lg"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HBL, MCB, UBL"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-number">{t("onboarding.step7.accountNumber")}</FieldLabel>
              <Input
                id="account-number"
                size="lg"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0123456789012"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-title">{t("onboarding.step7.accountTitle")}</FieldLabel>
              <Input
                id="account-title"
                size="lg"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                placeholder="e.g. Muhammad Tariq"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("onboarding.step6.paymentTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ALLOWED_PAYMENT_METHODS.map((method) => {
              const isSelected = methods.includes(method)
              const isCash = method === "Cash"
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => toggleMethod(method)}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted/60",
                    isCash && "cursor-default"
                  )}
                >
                  {method}
                  {isCash && (
                    <span className="ms-1 text-xs text-muted-foreground">
                      {t("onboarding.step6.cashRequired")}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={isPending}>
          {t("onboarding.actions.back")}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleSave}
          disabled={!canSubmit || isPending}
        >
          {isPending ? t("onboarding.actions.saving") : t("onboarding.actions.saveAndContinue")}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={onSkip} disabled={isPending}>
          {t("onboarding.actions.skip")}
        </Button>
      </div>
    </div>
  )
}
