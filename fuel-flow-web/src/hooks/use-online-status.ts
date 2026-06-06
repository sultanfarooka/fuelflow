import { useEffect, useState } from 'react'

import { NETWORK_ERROR_EVENT, NETWORK_OK_EVENT } from '@/lib/network-status'

/**
 * M07-F08 — connectivity state for the global offline banner.
 *
 * Combines two signals:
 * - `isOnline`     — the browser's `navigator.onLine` + `online`/`offline` events.
 * - `serverUnreachable` — set when an API call fails with no response (server
 *   down / unreachable) even though the browser believes it is online; cleared
 *   when the browser comes back online or a request next succeeds.
 *
 * `isReachable` is the combined "everything is fine" flag the banner reads.
 */
export interface OnlineStatus {
  isOnline: boolean
  serverUnreachable: boolean
  isReachable: boolean
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const [serverUnreachable, setServerUnreachable] = useState(false)

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true)
      setServerUnreachable(false)
    }
    const goOffline = () => setIsOnline(false)
    const onNetworkError = () => setServerUnreachable(true)
    const onNetworkOk = () => setServerUnreachable(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    window.addEventListener(NETWORK_ERROR_EVENT, onNetworkError)
    window.addEventListener(NETWORK_OK_EVENT, onNetworkOk)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener(NETWORK_ERROR_EVENT, onNetworkError)
      window.removeEventListener(NETWORK_OK_EVENT, onNetworkOk)
    }
  }, [])

  return {
    isOnline,
    serverUnreachable,
    isReachable: isOnline && !serverUnreachable,
  }
}
