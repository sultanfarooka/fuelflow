/**
 * [M08-F07-R06] Fuel Pricing child route of the Station Configuration hub.
 * Renders the shared `<UnderDevelopment />` placeholder until M06-F01 ships
 * a real UI. Owner + Manager only.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconTag } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration/pricing"
)({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: PricingPage,
})

function PricingPage() {
  const { t } = useTranslation()
  return <UnderDevelopment moduleName={t("nav.pricing")} icon={IconTag} />
}
