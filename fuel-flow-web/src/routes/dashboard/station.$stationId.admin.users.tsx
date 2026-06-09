/**
 * [M07-F10-R03] Users & Access (M01-F05..F07) — stub. Owner only.
 * Placeholder until user management ships.
 */
import { createFileRoute } from "@tanstack/react-router"
import { IconUsersGroup } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { UnderDevelopment } from "@/components/common/under-development"
import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/admin/users"
)({
  beforeLoad: () => requireRoles([ROLES.Owner]),
  component: UsersAccessStubPage,
})

function UsersAccessStubPage() {
  const { t } = useTranslation()
  return (
    <UnderDevelopment
      moduleName={t("nav.usersAccess")}
      description={t("underDevelopment.body")}
      icon={IconUsersGroup}
    />
  )
}
