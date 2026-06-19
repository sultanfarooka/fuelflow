/**
 * [M08-F07-R06] Nozzles child route of the Station Configuration hub.
 * Placeholder until M08-F03 ships. Owner/Manager guard inherited from parent.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconGasStation } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { ConfigBreadcrumb } from "@/components/station-config/config-breadcrumb"
import { UnderDevelopment } from "@/components/common/under-development"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration/nozzles"
)({
  component: NozzlesPage,
})

function NozzlesPage() {
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
          { label: t("nav.nozzlesConfig") },
        ]}
      />
      <UnderDevelopment moduleName={t("nav.nozzlesConfig")} icon={IconGasStation} />
    </div>
  )
}
