/**
 * [M07-F10-R04] Lubricants / Oil Shop (M09) — Owner only, Pro+ plan gate.
 * Starter plan → UpgradePrompt; Pro+ plan (unbuilt) → UnderDevelopment.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconDroplet } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"
import { useAuthStore } from "@/stores/auth-store"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/admin/lubricants"
)({
  beforeLoad: () => requireRoles([ROLES.Owner]),
  component: LubricantsPage,
})

function LubricantsPage() {
  const { t } = useTranslation()
  const subscription = useAuthStore((s) => s.subscription)
  const isProPlan =
    !!subscription?.planName &&
    subscription.planName.toLowerCase() !== "starter"

  if (!isProPlan) {
    return <UpgradePrompt featureName={t("nav.lubricants")} />
  }

  return (
    <UnderDevelopment
      moduleName={t("nav.lubricants")}
      description={t("underDevelopment.body")}
      icon={IconDroplet}
    />
  )
}
