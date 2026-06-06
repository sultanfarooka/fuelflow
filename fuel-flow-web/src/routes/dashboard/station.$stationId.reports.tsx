/**
 * [M07-F07] Reports module — stub. Role-guarded route that renders a "Coming
 * soon" placeholder inside the app shell until M07-F01..F03 ship their content.
 */
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ComingSoon } from "@/components/common/coming-soon"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute("/dashboard/station/$stationId/reports")({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager, ROLES.Accountant]),
  component: ReportsStubPage,
})

function ReportsStubPage() {
  const { t } = useTranslation()
  return <ComingSoon title={t("nav.reports")} />
}
