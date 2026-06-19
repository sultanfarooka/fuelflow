/**
 * [M08-F07-R06] Fuel Tanks child route of the Station Configuration hub.
 * Renders the shared `<UnderDevelopment />` placeholder until M08-F02 ships
 * a real UI. Owner + Manager only.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconBarrel } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration/tanks"
)({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: TanksPage,
})

function TanksPage() {
  const { t } = useTranslation()
  return <UnderDevelopment moduleName={t("nav.fuelTanks")} icon={IconBarrel} />
}
