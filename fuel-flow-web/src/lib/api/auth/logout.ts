/**
 * Auth API — logout
 */

import { api } from '../client'

/**
 * Logout — revokes refresh token on server (read from cookie).
 * Clears auth cookies on response. Call useAuthStore.getState().logout() after.
 */
export async function logout(): Promise<void> {
  await api.post('/auth/logout', {})
}
