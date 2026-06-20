/**
 * [M06-F01] Fuel Pricing child route of the Station Configuration hub
 * (M08-F07-R06). Owner/Manager guard inherited from the parent layout.
 */
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ConfigBreadcrumb } from "@/components/station-config/config-breadcrumb"
import { FuelPricingPanel } from "@/components/station-config/fuel-pricing-panel"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration/pricing"
)({
  component: PricingPage,
})

function PricingPage() {
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
          { label: t("nav.pricing") },
        ]}
      />
      <FuelPricingPanel stationId={stationId} />
    </div>
  )
}
