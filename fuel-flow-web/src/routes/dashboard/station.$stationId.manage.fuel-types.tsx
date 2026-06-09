/**
 * [M08-F07-R03] Fuel Types configuration — stub. Placeholder until M08-F02 ships its UI.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconFlame } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute("/dashboard/station/$stationId/manage/fuel-types")({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: FuelTypesConfigPage,
})

function FuelTypesConfigPage() {
  const { t } = useTranslation()
  return <UnderDevelopment moduleName={t("nav.fuelTypes")} icon={IconFlame} />
}
