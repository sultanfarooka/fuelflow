/**
 * [M07-F10-R03] Credit Customers (M15) — stub. Placeholder until M15 ships.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconCreditCard } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute("/dashboard/station/$stationId/credit")({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager, ROLES.Custom]),
  component: CreditStubPage,
})

function CreditStubPage() {
  const { t } = useTranslation()
  return (
    <UnderDevelopment
      moduleName={t("nav.credit")}
      description={t("underDevelopment.body")}
      icon={IconCreditCard}
    />
  )
}
