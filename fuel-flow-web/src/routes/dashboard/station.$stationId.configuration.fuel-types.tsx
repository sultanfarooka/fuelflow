/**
 * [M08-F07-R06 + M08-F08] Fuel Types child route of the Station Configuration
 * hub. Renders the existing `<FuelTypesPanel />` under the shared breadcrumb.
 * Owner/Manager guard is inherited from the parent layout.
 */
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ConfigBreadcrumb } from "@/components/station-config/config-breadcrumb"
import { FuelTypesPanel } from "@/components/station-config/fuel-types-panel"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration/fuel-types"
)({
  component: FuelTypesPage,
})

function FuelTypesPage() {
  const { t } = useTranslation()
  const { stationId } = Route.useParams()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <ConfigBreadcrumb
        items={[
          { label: t("nav.dashboard"), to: "/dashboard/station/$stationId", params: { stationId } },
          {
            label: t("nav.stationConfig"),
            to: "/dashboard/station/$stationId/configuration",
            params: { stationId },
          },
          { label: t("nav.fuelTypes") },
        ]}
      />
      <FuelTypesPanel stationId={stationId} />
    </div>
  )
}
