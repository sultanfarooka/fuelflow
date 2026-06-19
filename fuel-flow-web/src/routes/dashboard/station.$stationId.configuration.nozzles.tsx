/**
 * [M08-F07-R06] Nozzles child route of the Station Configuration hub.
 * Renders the shared `<UnderDevelopment />` placeholder until M08-F03 ships
 * a real UI. Owner + Manager only.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconGasStation } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration/nozzles"
)({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: NozzlesPage,
})

function NozzlesPage() {
  const { t } = useTranslation()
  return (
    <UnderDevelopment moduleName={t("nav.nozzlesConfig")} icon={IconGasStation} />
  )
}
