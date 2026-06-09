/**
 * [M08-F07-R03] Nozzle configuration — stub. Placeholder until M08-F03 ships its UI.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconGasStation } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute("/dashboard/station/$stationId/manage/nozzles")({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: NozzlesConfigPage,
})

function NozzlesConfigPage() {
  const { t } = useTranslation()
  return <UnderDevelopment moduleName={t("nav.nozzlesConfig")} icon={IconGasStation} />
}
