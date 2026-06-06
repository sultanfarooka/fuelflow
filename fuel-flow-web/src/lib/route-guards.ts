/**
 * [M07-F07] Reusable `beforeLoad` role guard for protected routes.
 *
 * Runs outside React context (TanStack `beforeLoad`), so it reads the auth
 * store via `getState()` and `throw redirect(...)` rather than navigating.
 * The parent `/dashboard` guard already enforces authentication + onboarding;
 * this only narrows by role. Frontend role checks are UX — the API still
 * authorises every request.
 */
import { redirect } from "@tanstack/react-router"

import { hasAnyRole } from "@/lib/roles"
import { useAuthStore } from "@/stores/auth-store"

/**
 * Throws a redirect to `/dashboard` when the current user holds none of the
 * `allowed` roles. Call from a route's `beforeLoad`.
 */
export function requireRoles(allowed: readonly string[]): void {
  const { user } = useAuthStore.getState()
  if (!hasAnyRole(user?.roles, allowed)) {
    throw redirect({ to: "/dashboard" })
  }
}
