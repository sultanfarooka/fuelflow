import { IconRefresh, IconWifiOff } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { emitNetworkOk } from '@/lib/network-status'

/**
 * M07-F08-R03 — global offline retry banner.
 *
 * Mounted once near the app root so it covers every screen. Shows whenever the
 * browser is offline OR the API is unreachable; auto-hides when connectivity
 * returns. "Retry" optimistically clears the unreachable flag and refetches
 * active queries — if still offline, the next failure re-raises the banner.
 * No offline queue (R03: "queue not required").
 */
export function OfflineBanner() {
  const { isOnline, isReachable } = useOnlineStatus()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  if (isReachable) return null

  const handleRetry = () => {
    emitNetworkOk()
    void queryClient.refetchQueries()
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-3 border-b border-black/10 bg-destructive px-4 py-2 text-sm text-white shadow-sm"
    >
      <IconWifiOff className="size-4 shrink-0" aria-hidden />
      <span className="font-medium">
        {isOnline ? t('offline.unreachable') : t('offline.title')}
      </span>
      <span className="hidden text-white/80 sm:inline">
        {t('offline.body')}
      </span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="ms-1 h-7"
        onClick={handleRetry}
      >
        <IconRefresh className="me-1 size-3.5" aria-hidden />
        {t('offline.retry')}
      </Button>
    </div>
  )
}
