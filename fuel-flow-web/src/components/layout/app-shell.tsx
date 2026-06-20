/**
 * [M07-F07] Application shell: the cross-cutting authenticated layout. Wraps
 * every authenticated page with the role-aware sidebar (R01), a top bar with
 * station switcher + user menu + language/theme toggles (R02), and an
 * `<Outlet />` content area (R03). Mobile collapse to a drawer (R04) and
 * active-route highlighting (R05) come from the sidebar primitive + AppSidebar.
 *
 * Used by both `dashboard/route.tsx` and `settings/route.tsx`. Authentication
 * and onboarding guards stay in those route files; the shell is presentation.
 */
import { useEffect } from "react"
import { Outlet, useParams, useRouterState } from "@tanstack/react-router"
import { IconAlertCircle, IconLogout } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { StationSwitcher } from "@/components/layout/station-switcher"
import { LanguageSwitch } from "@/components/language-switch"
import { ModeToggle } from "@/components/dark-mode-toggle"
import { logout } from "@/lib/api/auth"
import { useAuthStore } from "@/stores/auth-store"
import { useUiStore } from "@/stores/ui-store"

export function AppShell() {
  const { t } = useTranslation()
  const { user, organization, stations, devBypassActive, logout: clearAuth } = useAuthStore()
  const activeStationId = useUiStore((s) => s.activeStationId)
  const { location } = useRouterState()
  const isOrgDashboard = location.pathname === "/dashboard"
  const setActiveStation = useUiStore((s) => s.setActiveStation)

  // [M07-F07-R02] Keep the active station in sync when the user lands on a
  // station route directly (deep link, refresh, or in-page Link) so the
  // switcher label and station-scoped nav reflect the URL.
  const params = useParams({ strict: false }) as { stationId?: string }
  useEffect(() => {
    if (params.stationId && params.stationId !== activeStationId) {
      setActiveStation(params.stationId)
    }
  }, [params.stationId, activeStationId, setActiveStation])

  // [M12-F02-R04] Dev-bypass banner — only when the bypass is active AND the
  // first station hasn't completed onboarding.
  const showDevBypassBanner = devBypassActive && !stations?.[0]?.isSetupComplete

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      clearAuth()
      window.location.href = "/"
    }
  }

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "?")

  // [M07-F06] Org dashboard — no sidebar, minimal top bar only.
  if (isOrgDashboard) {
    return (
      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
          <span className="text-sm font-semibold">{organization?.name}</span>
          <div className="ms-auto flex items-center gap-2">
            <LanguageSwitch />
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {initials}
                  </span>
                  <span className="sr-only">{t("nav.userMenu")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email ?? user?.phone}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <IconLogout className="me-2 size-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {showDevBypassBanner && (
          <div className="border-b border-accent bg-accent/40">
            <div className="px-4 py-2">
              <Alert className="border-0 bg-transparent p-0">
                <IconAlertCircle className="text-accent-foreground" />
                <AlertTitle className="text-accent-foreground">
                  {t("dashboard.devBypass.bannerTitle")}
                </AlertTitle>
                <AlertDescription className="text-accent-foreground/80">
                  {t("dashboard.devBypass.bannerDescription")}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
          <SidebarTrigger />
          <Separator orientation="vertical" className="me-1 h-6" />
          <StationSwitcher />
          <div className="ms-auto flex items-center gap-2">
            <LanguageSwitch />
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {initials}
                  </span>
                  <span className="sr-only">{t("nav.userMenu")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email ?? user?.phone}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <IconLogout className="me-2 size-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {showDevBypassBanner && (
          <div className="border-b border-accent bg-accent/40">
            <div className="px-4 py-2">
              <Alert className="border-0 bg-transparent p-0">
                <IconAlertCircle className="text-accent-foreground" />
                <AlertTitle className="text-accent-foreground">
                  {t("dashboard.devBypass.bannerTitle")}
                </AlertTitle>
                <AlertDescription className="text-accent-foreground/80">
                  {t("dashboard.devBypass.bannerDescription")}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
