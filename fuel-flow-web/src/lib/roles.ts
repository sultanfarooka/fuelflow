/**
 * Role constants + helpers for [M07-F07] role-aware navigation and route guards.
 *
 * Roles mirror the backend `UserRole` enum (Owner, Manager, Nozzleman,
 * Accountant, Custom) and arrive on `UserInfo.roles: string[]` in the login
 * response. **Frontend role checks are UX only** — every request is authorised
 * server-side regardless of what the UI shows (see routes/CLAUDE.md).
 */

export const ROLES = {
  Owner: "Owner",
  Manager: "Manager",
  Nozzleman: "Nozzleman",
  Accountant: "Accountant",
  Custom: "Custom",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * True when the user holds at least one of the allowed roles. An empty
 * `allowed` list means "any authenticated role" and always passes.
 */
export function hasAnyRole(
  userRoles: string[] | null | undefined,
  allowed: readonly string[],
): boolean {
  if (allowed.length === 0) return true;
  if (!userRoles || userRoles.length === 0) return false;
  // Case-insensitive: the backend may serialize roles in any casing ([M01-F05-R02]).
  const allowedLower = allowed.map((a) => a.toLowerCase());
  return userRoles.some((r) => allowedLower.includes(r.toLowerCase()));
}
