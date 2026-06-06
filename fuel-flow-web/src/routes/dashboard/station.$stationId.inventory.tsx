/**
 * [M07-F07] Inventory module — stub. Role-guarded route that renders a "Coming
 * soon" placeholder inside the app shell until M02 ships its content.
 */
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ComingSoon } from "@/components/common/coming-soon"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute("/dashboard/station/$stationId/inventory")({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: InventoryStubPage,
})

function InventoryStubPage() {
  const { t } = useTranslation()
  return <ComingSoon title={t("nav.inventory")} />
}
