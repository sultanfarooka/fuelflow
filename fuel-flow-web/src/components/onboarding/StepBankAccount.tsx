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
import { useAuthStore } from "@/stores/auth-store"

interface Props {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function StepBankAccount({ onNext, onBack, onSkip }: Props) {
  const { t } = useTranslation()
  const organization = useAuthStore((s) => s.organization)
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountTitle, setAccountTitle] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createBankAccount(organization!.id, {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountTitle: accountTitle.trim(),
        isPrimary: true,
      }),
    onSuccess: () => {
      toast.success(t("onboarding.step7.savedToast"))
      onNext()
    },
    onError: () => {
      setSubmitError(t("onboarding.step7.saveError"))
    },
  })

  const canSubmit = bankName.trim() && accountNumber.trim() && accountTitle.trim()

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
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HBL, MCB, UBL"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-number">{t("onboarding.step7.accountNumber")}</FieldLabel>
              <Input
                id="account-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0123456789012"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-title">{t("onboarding.step7.accountTitle")}</FieldLabel>
              <Input
                id="account-title"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                placeholder="e.g. Muhammad Tariq"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={mutation.isPending}>
          {t("onboarding.actions.back")}
        </Button>
        <Button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
        >
          {mutation.isPending ? t("onboarding.actions.saving") : t("onboarding.actions.saveAndContinue")}
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip} disabled={mutation.isPending}>
          {t("onboarding.actions.skip")}
        </Button>
      </div>
    </div>
  )
}
