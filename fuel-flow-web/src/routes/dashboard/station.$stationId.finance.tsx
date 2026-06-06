/**
 * [M07-F07] Finance module — stub. Role-guarded route that renders a "Coming
 * soon" placeholder inside the app shell until M05 ships its content.
 */
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ComingSoon } from "@/components/common/coming-soon"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute("/dashboard/station/$stationId/finance")({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager, ROLES.Accountant]),
  component: FinanceStubPage,
})

function FinanceStubPage() {
  const { t } = useTranslation()
  return <ComingSoon title={t("nav.finance")} />
}
