/**
 * [M07-F10-R01] The application sidebar: role-aware grouped nav links rendered
 * from `getNavItems`, with group labels and active-route highlighting.
 * Pure presentation over the shadcn Sidebar primitive — visibility and grouping
 * logic lives in nav-config.ts.
 */
import { Link, useRouterState, type LinkProps } from "@tanstack/react-router"
import { IconGasStation } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getNavItems, NAV_GROUPS, type NavGroup } from "@/components/layout/nav-config"
import { useAuthStore } from "@/stores/auth-store"
import { useUiStore } from "@/stores/ui-store"

/** Resolve `$stationId` in a route path against the active station. */
function resolvePath(to: string, params?: Record<string, string>): string {
  if (!params) return to
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`$${key}`, value),
    to
  )
}

/**
 * Active when the current path matches the item's resolved path. Org dashboard
 * and the station overview match exactly (they are prefixes of deeper routes);
 * every other item matches as a path prefix so child routes keep it lit.
 */
function isActive(itemKey: string, resolvedPath: string, pathname: string): boolean {
  if (itemKey === "organization" || itemKey === "station") {
    return pathname === resolvedPath
  }
  return pathname === resolvedPath || pathname.startsWith(`${resolvedPath}/`)
}

/** i18n key for a nav group label. Settings group has no separate label. */
function groupLabelKey(group: NavGroup): string | null {
  if (group === "settings") return null
  return `nav.groups.${group}`
}

export function AppSidebar() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const activeStationId = useUiStore((s) => s.activeStationId)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const items = getNavItems(user?.roles, activeStationId)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1.5">
          <IconGasStation className="size-5 text-primary" />
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Fuel Flow
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group)
          if (groupItems.length === 0) return null
          const labelKey = groupLabelKey(group)
          return (
            <SidebarGroup key={group}>
              {labelKey && (
                <SidebarGroupLabel>{t(labelKey)}</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItems.map((item) => {
                    const resolved = resolvePath(item.to, item.params)
                    const label = t(item.labelKey)
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          asChild
                          tooltip={label}
                          isActive={isActive(item.key, resolved, pathname)}
                        >
                          <Link
                            to={item.to as LinkProps["to"]}
                            params={item.params as LinkProps["params"]}
                          >
                            <Icon />
                            <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}
