/**
 * [M07-F07] Settings route tree. Owner-only, rendered inside the same app shell
 * as the dashboard so the Settings nav link resolves cleanly. Content is a stub
 * until M08 ships.
 */
import { createFileRoute, redirect } from "@tanstack/react-router"

import { AppShell } from "@/components/layout/app-shell"
import { ROLES, hasAnyRole } from "@/lib/roles"
import { useAuthStore } from "@/stores/auth-store"

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: "/auth/login", search: { redirect: "/settings" } })
    }
    if (!hasAnyRole(user?.roles, [ROLES.Owner, ROLES.Manager])) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: AppShell,
})
