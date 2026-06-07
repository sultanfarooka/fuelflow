/**
 * [M07-F10-R03] Fuel Pricing (M06) — stub. Placeholder until M06 ships its UI.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconTag } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute("/dashboard/station/$stationId/pricing")({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager, ROLES.Custom]),
  component: PricingStubPage,
})

function PricingStubPage() {
  const { t } = useTranslation()
  return (
    <UnderDevelopment
      moduleName={t("nav.pricing")}
      description={t("underDevelopment.body")}
      icon={IconTag}
    />
  )
}
