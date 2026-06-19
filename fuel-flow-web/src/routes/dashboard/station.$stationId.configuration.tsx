/**
 * [M08-F07-R06] Station Configuration — layout route.
 *
 * Pure layout: enforces the Owner/Manager guard once for itself and every
 * child route, then renders the child via `<Outlet />`. The hub cards are
 * owned by the sibling `configuration.index.tsx`; the area sub-pages live in
 * `configuration.{fuel-types,pricing,tanks,nozzles}.tsx`.
 */
import { Outlet, createFileRoute } from "@tanstack/react-router"

import { ROLES } from "@/lib/roles"
import { requireRoles } from "@/lib/route-guards"

export const Route = createFileRoute(
  "/dashboard/station/$stationId/configuration"
)({
  beforeLoad: () => requireRoles([ROLES.Owner, ROLES.Manager]),
  component: StationConfigurationLayout,
})

function StationConfigurationLayout() {
  return <Outlet />
}
