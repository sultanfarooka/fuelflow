/**
 * [M08-F07-R06] Fuel Tanks child route of the Station Configuration hub.
 * Placeholder until M08-F02 ships. Owner/Manager guard inherited from parent.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconBarrel } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { ConfigBreadcrumb } from "@/components/station-config/config-breadcrumb"
import { UnderDevelopment } from "@/components/common/under-development"

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
      <UnderDevelopment moduleName={t("nav.fuelTanks")} icon={IconBarrel} />
    </div>
  )
}
