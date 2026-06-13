/**
 * [M08-F07] Station Configuration — a single tabbed page (under the Admin nav
 * group) that consolidates the four station-level configuration surfaces:
 * Fuel Types, Fuel Pricing, Fuel Tanks, and Nozzles. Each tab currently renders
 * the shared <UnderDevelopment /> placeholder; they are replaced in place by the
 * real UIs as their backing features ship:
 *   - Fuel Types   → M08-F08
 *   - Fuel Pricing → M06-F01
 *   - Fuel Tanks   → M08-F02
 *   - Nozzles      → M08-F03
 * Owner + Manager only (route guard + nav gating; API enforces regardless).
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconBarrel, IconFlame, IconGasStation, IconTag } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration"
)({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: StationConfigurationPage,
})

function StationConfigurationPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">
        {t("nav.stationConfig")}
      </h1>

      <Tabs defaultValue="fuel-types">
        <TabsList>
          <TabsTrigger value="fuel-types">
            <IconFlame data-icon="inline-start" />
            {t("nav.fuelTypes")}
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <IconTag data-icon="inline-start" />
            {t("nav.pricing")}
          </TabsTrigger>
          <TabsTrigger value="tanks">
            <IconBarrel data-icon="inline-start" />
            {t("nav.fuelTanks")}
          </TabsTrigger>
          <TabsTrigger value="nozzles">
            <IconGasStation data-icon="inline-start" />
            {t("nav.nozzlesConfig")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fuel-types">
          <UnderDevelopment moduleName={t("nav.fuelTypes")} icon={IconFlame} />
        </TabsContent>
        <TabsContent value="pricing">
          <UnderDevelopment moduleName={t("nav.pricing")} icon={IconTag} />
        </TabsContent>
        <TabsContent value="tanks">
          <UnderDevelopment moduleName={t("nav.fuelTanks")} icon={IconBarrel} />
        </TabsContent>
        <TabsContent value="nozzles">
          <UnderDevelopment moduleName={t("nav.nozzlesConfig")} icon={IconGasStation} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
