/**
 * [M07-F10-R03] Nozzle Operations (M03) — stub. Placeholder until M03 ships.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconGasStation } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute("/dashboard/station/$stationId/nozzles")({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager, ROLES.Custom]),
  component: NozzlesStubPage,
})

function NozzlesStubPage() {
  const { t } = useTranslation()
  return (
    <UnderDevelopment
      moduleName={t("nav.nozzles")}
      description={t("underDevelopment.body")}
      icon={IconGasStation}
    />
  )
}
