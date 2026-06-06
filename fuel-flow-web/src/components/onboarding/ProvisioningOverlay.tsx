import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

export function ProvisioningOverlay() {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="size-10 animate-spin text-primary" />
      <h2 className="text-xl font-semibold text-foreground">
        {t("onboarding.provisioning.title")}
      </h2>
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        {t("onboarding.provisioning.body")}
      </p>
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        {t("onboarding.provisioning.note")}
      </p>
    </div>
  )
}
