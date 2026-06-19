/**
 * [M08-F07-R06] Station Configuration — list-menu hub (index route).
 *
 * Lives at `/dashboard/station/:stationId/configuration` exactly. Renders the
 * four navigation cards (Fuel Types, Fuel Pricing, Fuel Tanks, Nozzles) and
 * the breadcrumb. The Owner/Manager guard is inherited from the parent
 * layout route (`configuration.tsx`), so no extra guard is needed here.
 */
import { createFileRoute } from "@tanstack/react-router"
import {
  IconBarrel,
  IconFlame,
  IconGasStation,
  IconTag,
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { ConfigBreadcrumb } from "@/components/station-config/config-breadcrumb"
import { ConfigMenuCard } from "@/components/station-config/config-menu-card"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration/"
)({
  component: StationConfigurationHub,
})

function StationConfigurationHub() {
  const { t } = useTranslation()
  const { stationId } = Route.useParams()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <ConfigBreadcrumb
        items={[
          { label: t("nav.dashboard"), to: "/dashboard/station/$stationId", params: { stationId } },
          { label: t("nav.stationConfig") },
        ]}
      />

      <div className="mb-5 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("nav.stationConfig")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("stationConfig.hubDescription")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <ConfigMenuCard
          to="/dashboard/station/$stationId/configuration/fuel-types"
          params={{ stationId }}
          icon={IconFlame}
          title={t("nav.fuelTypes")}
          description={t("stationConfig.fuelTypesDesc")}
        />
        <ConfigMenuCard
          to="/dashboard/station/$stationId/configuration/pricing"
          params={{ stationId }}
          icon={IconTag}
          title={t("nav.pricing")}
          description={t("stationConfig.pricingDesc")}
        />
        <ConfigMenuCard
          to="/dashboard/station/$stationId/configuration/tanks"
          params={{ stationId }}
          icon={IconBarrel}
          title={t("nav.fuelTanks")}
          description={t("stationConfig.tanksDesc")}
        />
        <ConfigMenuCard
          to="/dashboard/station/$stationId/configuration/nozzles"
          params={{ stationId }}
          icon={IconGasStation}
          title={t("nav.nozzlesConfig")}
          description={t("stationConfig.nozzlesDesc")}
        />
      </div>
    </div>
  )
}
