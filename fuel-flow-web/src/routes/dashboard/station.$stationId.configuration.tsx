/**
 * [M08-F07-R06] Station Configuration — list-menu hub.
 *
 * Renders a stacked list of clickable cards (icon + title + description +
 * chevron) for the four sub-areas: Fuel Types, Fuel Pricing, Fuel Tanks,
 * Nozzles. Each card navigates to its own child route at
 * `/configuration/<slug>`, which renders the area's real UI or the shared
 * `<UnderDevelopment />` placeholder until its backing feature ships.
 *
 * Supersedes the previous tabbed layout (R02 / R04). Owner + Manager only.
 */
import { createFileRoute } from "@tanstack/react-router"
import {
  IconBarrel,
  IconFlame,
  IconGasStation,
  IconTag,
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { ConfigMenuCard } from "@/components/station-config/config-menu-card"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration"
)({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: StationConfigurationHub,
})

function StationConfigurationHub() {
  const { t } = useTranslation()
  const { stationId } = Route.useParams()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 space-y-1">
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
