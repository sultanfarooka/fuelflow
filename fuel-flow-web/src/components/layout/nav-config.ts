/**
 * [M07-F07-R01] Role-aware navigation configuration.
 *
 * `getNavItems` is a pure function (no React, no router) so the role/scope
 * filtering is unit-testable in isolation — see the M07_F07_R01 test. The
 * sidebar component renders whatever this returns.
 *
 * Visibility rules:
 *  - Role: an item shows if the user holds at least one of its `roles`.
 *  - Scope: `org` items always show; `station` items show only when a station
 *    is active (the station switcher has selected one — not "All Stations").
 *
 * Mirrors the route→access table in routes/CLAUDE.md. Frontend checks are UX
 * only; the API enforces access regardless.
 */
import {
  IconAdjustments,
  IconBarrel,
  IconBuildingStore,
  IconChartBar,
  IconClockHour4,
  IconGasStation,
  IconSettings,
  IconUsers,
  IconWallet,
  type Icon,
} from "@tabler/icons-react"

import { ROLES, hasAnyRole } from "@/lib/roles"

export type NavScope = "org" | "station"

export interface NavItemConfig {
  key: string
  /** i18n key under `nav.*`. */
  labelKey: string
  icon: Icon
  /** TanStack Router route path. */
  to: string
  /** Roles allowed to see this item (union across the user's roles). */
  roles: readonly string[]
  scope: NavScope
}

export interface NavItem extends Omit<NavItemConfig, "roles"> {
  /** Route params filled in for station-scoped items. */
  params?: Record<string, string>
}

/**
 * The full catalogue. Order here is the render order in the sidebar.
 * Station-scoped `to` values use the `$stationId` param placeholder; the param
 * is resolved against the active station in `getNavItems`.
 */
const NAV_CATALOGUE: readonly NavItemConfig[] = [
  {
    key: "organization",
    labelKey: "nav.organization",
    icon: IconBuildingStore,
    to: "/dashboard",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Accountant, ROLES.Custom],
    scope: "org",
  },
  {
    key: "station",
    labelKey: "nav.station",
    icon: IconGasStation,
    to: "/dashboard/station/$stationId",
    roles: [ROLES.Owner, ROLES.Manager],
    scope: "station",
  },
  {
    key: "shifts",
    labelKey: "nav.shifts",
    icon: IconClockHour4,
    to: "/dashboard/station/$stationId/shifts",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Nozzleman],
    scope: "station",
  },
  {
    key: "inventory",
    labelKey: "nav.inventory",
    icon: IconBarrel,
    to: "/dashboard/station/$stationId/inventory",
    roles: [ROLES.Owner, ROLES.Manager],
    scope: "station",
  },
  {
    key: "finance",
    labelKey: "nav.finance",
    icon: IconWallet,
    to: "/dashboard/station/$stationId/finance",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Accountant],
    scope: "station",
  },
  {
    key: "reports",
    labelKey: "nav.reports",
    icon: IconChartBar,
    to: "/dashboard/station/$stationId/reports",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Accountant],
    scope: "station",
  },
  {
    key: "setup",
    labelKey: "nav.setup",
    icon: IconAdjustments,
    to: "/dashboard/station/$stationId/setup",
    roles: [ROLES.Owner, ROLES.Manager],
    scope: "station",
  },
  {
    key: "users",
    labelKey: "nav.users",
    icon: IconUsers,
    to: "/settings/users",
    roles: [ROLES.Owner],
    scope: "org",
  },
  {
    key: "settings",
    labelKey: "nav.settings",
    icon: IconSettings,
    to: "/settings",
    roles: [ROLES.Owner],
    scope: "org",
  },
]

/**
 * Returns the nav items visible to a user with `roles`, given the currently
 * `activeStationId` (null = "All Stations"). Station-scoped items are omitted
 * when no station is active; when one is, their `$stationId` param is resolved.
 */
export function getNavItems(
  roles: string[] | null | undefined,
  activeStationId: string | null
): NavItem[] {
  return NAV_CATALOGUE.filter((item) => hasAnyRole(roles, item.roles))
    .filter((item) => item.scope === "org" || activeStationId !== null)
    .map(({ roles: _roles, ...item }) => {
      void _roles
      return item.scope === "station" && activeStationId
        ? { ...item, params: { stationId: activeStationId } }
        : item
    })
}
