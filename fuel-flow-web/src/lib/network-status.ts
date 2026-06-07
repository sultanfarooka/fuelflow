/**
 * M07-F08 — decoupled signal for transient API network failures.
 *
 * The Axios client (`lib/api/client.ts`) dispatches these window events when a
 * request fails with no server response (offline / server unreachable) and when
 * a request next succeeds. `useOnlineStatus` subscribes to them. Using plain
 * window events keeps the API client free of React / store imports.
 */

export const NETWORK_ERROR_EVENT = 'app:network-error'
export const NETWORK_OK_EVENT = 'app:network-ok'

export function emitNetworkError(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NETWORK_ERROR_EVENT))
  }
}

export function emitNetworkOk(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NETWORK_OK_EVENT))
  }
}
