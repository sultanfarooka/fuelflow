/**
 * [M08-F02] Fuel Tanks child route of the Station Configuration hub
 * (M08-F07-R06). Owner/Manager guard inherited from the parent layout.
 */
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ConfigBreadcrumb } from "@/components/station-config/config-breadcrumb"
import { FuelTanksPanel } from "@/components/station-config/fuel-tanks-panel"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration/tanks"
)({
  component: TanksPage,
})

function TanksPage() {
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
          { label: t("nav.fuelTanks") },
        ]}
      />
      <FuelTanksPanel stationId={stationId} />
    </div>
  )
}
