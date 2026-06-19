/**
 * [M08-F07-R06 + M08-F08] Fuel Types child route of the Station Configuration
 * hub. Renders the existing `<FuelTypesPanel />` (formerly the Fuel Types tab).
 * Owner + Manager only — guard duplicated here because sibling routes do not
 * inherit the hub's `beforeLoad`.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconFlame } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { FuelTypesPanel } from "@/components/station-config/fuel-types-panel"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration/fuel-types"
)({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: FuelTypesPage,
})

function FuelTypesPage() {
  const { t } = useTranslation()
  const { stationId } = Route.useParams()

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <IconFlame className="size-5 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("nav.fuelTypes")}
        </h1>
      </div>
      <FuelTypesPanel stationId={stationId} />
    </div>
  )
}
