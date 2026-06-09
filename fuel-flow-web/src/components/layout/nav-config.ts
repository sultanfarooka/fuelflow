/**
 * [M07-F10-R01/R02] Role-aware navigation configuration.
 *
 * `getNavItems` is a pure function (no React, no router) so the role/scope
 * filtering is unit-testable in isolation. The sidebar component renders
 * whatever this returns.
 *
 * Visibility rules:
 *  - Role: an item shows if the user holds at least one of its `roles`.
 *  - Scope: `org` items always show; `station` items show only when a station
 *    is active (the station switcher has selected one — not "All Stations").
 *  - Group: every item belongs to one of five groups rendered with labels.
 *  - Plan gate: `planGate: 'pro-plus'` items always appear in the nav; the
 *    route page itself shows <UpgradePrompt /> for Starter users.
 *
 * Custom User approximation (M07-F10): Custom users see all items whose
 * `roles` array includes ROLES.Custom. Fine-grained per-module permission
 * grants (M01-F06) will layer on top when that feature ships.
 *
 * Mirrors the route→access table in routes/CLAUDE.md. Frontend checks are
 * UX only; the API enforces access regardless.
 */
import {
  IconBarrel,
  IconBuildingStore,
  IconChartBar,
  IconClockHour4,
  IconCreditCard,
  IconDroplet,
  IconFlame,
  IconGasStation,
  IconId,
  IconSettings,
  IconTag,
  IconUsersGroup,
  IconWallet,
  type Icon,
} from "@tabler/icons-react"

import { ROLES, hasAnyRole } from "@/lib/roles"

export type NavScope = "org" | "station"
export type NavGroup = "operations" | "station-management" | "commercial" | "reports" | "admin" | "settings"

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
  group: NavGroup
  /** Present when a Pro+ subscription is needed. Page handles the gate display. */
  planGate?: "pro-plus"
}

export interface NavItem extends Omit<NavItemConfig, "roles"> {
  /** Route params filled in for station-scoped items. */
  params?: Record<string, string>
}

/**
 * Ordered groups for sidebar rendering. Groups with no visible items are
 * skipped by the sidebar component.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  "operations",
  "station-management",
  "commercial",
  "reports",
  "admin",
  "settings",
]

/**
 * The full catalogue. Order here is the render order within each group.
 * Station-scoped `to` values use the `$stationId` param placeholder resolved
 * against the active station in `getNavItems`.
 */
const NAV_CATALOGUE: readonly NavItemConfig[] = [
  // ── Operations ──────────────────────────────────────────────────────────
  {
    key: "organization",
    labelKey: "nav.dashboard",
    icon: IconBuildingStore,
    to: "/dashboard",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Accountant, ROLES.Custom],
    scope: "org",
    group: "operations",
  },
  {
    key: "shifts",
    labelKey: "nav.shifts",
    icon: IconClockHour4,
    to: "/dashboard/station/$stationId/shifts",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Custom],
    scope: "station",
    group: "operations",
  },
  {
    key: "nozzles",
    labelKey: "nav.nozzles",
    icon: IconGasStation,
    to: "/dashboard/station/$stationId/nozzles",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Custom],
    scope: "station",
    group: "operations",
  },
  {
    key: "inventory",
    labelKey: "nav.inventory",
    icon: IconBarrel,
    to: "/dashboard/station/$stationId/inventory",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Custom],
    scope: "station",
    group: "operations",
  },
  // ── Station Management (Owner + Manager only) ────────────────────────────
  {
    key: "pricing",
    labelKey: "nav.pricing",
    icon: IconTag,
    to: "/dashboard/station/$stationId/pricing",
    roles: [ROLES.Owner, ROLES.Manager],
    scope: "station",
    group: "station-management",
  },
  {
    key: "fuelTypes",
    labelKey: "nav.fuelTypes",
    icon: IconFlame,
    to: "/dashboard/station/$stationId/manage/fuel-types",
    roles: [ROLES.Owner, ROLES.Manager],
    scope: "station",
    group: "station-management",
  },
  {
    key: "fuelTanks",
    labelKey: "nav.fuelTanks",
    icon: IconBarrel,
    to: "/dashboard/station/$stationId/manage/tanks",
    roles: [ROLES.Owner, ROLES.Manager],
    scope: "station",
    group: "station-management",
  },
  {
    key: "nozzlesConfig",
    labelKey: "nav.nozzlesConfig",
    icon: IconGasStation,
    to: "/dashboard/station/$stationId/manage/nozzles",
    roles: [ROLES.Owner, ROLES.Manager],
    scope: "station",
    group: "station-management",
  },
  // ── Commercial ──────────────────────────────────────────────────────────
  {
    key: "credit",
    labelKey: "nav.credit",
    icon: IconCreditCard,
    to: "/dashboard/station/$stationId/credit",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Custom],
    scope: "station",
    group: "commercial",
  },
  {
    key: "finance",
    labelKey: "nav.finance",
    icon: IconWallet,
    to: "/dashboard/station/$stationId/finance",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Accountant, ROLES.Custom],
    scope: "station",
    group: "commercial",
  },
  // ── Reports ─────────────────────────────────────────────────────────────
  {
    key: "reports",
    labelKey: "nav.reports",
    icon: IconChartBar,
    to: "/dashboard/station/$stationId/reports",
    roles: [ROLES.Owner, ROLES.Manager, ROLES.Accountant, ROLES.Custom],
    scope: "station",
    group: "reports",
  },
  // ── Admin ────────────────────────────────────────────────────────────────
  {
    key: "usersAccess",
    labelKey: "nav.usersAccess",
    icon: IconUsersGroup,
    to: "/dashboard/station/$stationId/admin/users",
    roles: [ROLES.Owner],
    scope: "station",
    group: "admin",
  },
  {
    key: "staffPayroll",
    labelKey: "nav.staffPayroll",
    icon: IconId,
    to: "/dashboard/station/$stationId/admin/staff",
    roles: [ROLES.Owner],
    scope: "station",
    group: "admin",
    planGate: "pro-plus",
  },
  {
    key: "lubricants",
    labelKey: "nav.lubricants",
    icon: IconDroplet,
    to: "/dashboard/station/$stationId/admin/lubricants",
    roles: [ROLES.Owner],
    scope: "station",
    group: "admin",
    planGate: "pro-plus",
  },
  // ── Settings ─────────────────────────────────────────────────────────────
  {
    key: "settings",
    labelKey: "nav.settings",
    icon: IconSettings,
    to: "/settings",
    roles: [ROLES.Owner, ROLES.Manager],
    scope: "org",
    group: "settings",
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
