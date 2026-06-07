/**
 * [M07-F10-R04] Staff & Payroll (M13) — Owner only, Pro+ plan gate.
 * Starter plan → UpgradePrompt; Pro+ plan (unbuilt) → UnderDevelopment.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconId } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"
import { useAuthStore } from "@/stores/auth-store"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/admin/staff"
)({
  beforeLoad: () => requireRoles([ROLES.Owner]),
  component: StaffPayrollPage,
})

function StaffPayrollPage() {
  const { t } = useTranslation()
  const subscription = useAuthStore((s) => s.subscription)
  const isProPlan =
    !!subscription?.planName &&
    subscription.planName.toLowerCase() !== "starter"

  if (!isProPlan) {
    return <UpgradePrompt featureName={t("nav.staffPayroll")} />
  }

  return (
    <UnderDevelopment
      moduleName={t("nav.staffPayroll")}
      description={t("underDevelopment.body")}
      icon={IconId}
    />
  )
}
