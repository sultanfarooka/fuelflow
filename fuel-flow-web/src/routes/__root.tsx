import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { location } = useRouterState();
  const isAuthRoute = location.pathname.startsWith("/auth");
  const isOnboardingRoute = location.pathname.startsWith("/onboarding");
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  // [M07-F07] /settings renders inside its own AppShell (see settings/route.tsx),
  // so it gets the bare Outlet like the other authenticated route trees.
  const isSettingsRoute = location.pathname.startsWith("/settings");
  // Design playground (dev-only) carries its own layout — see routes/design/route.tsx.
  const isDesignRoute = location.pathname.startsWith("/design");

  if (isAuthRoute || isOnboardingRoute || isDashboardRoute || isSettingsRoute || isDesignRoute) {
    return (
      <>
        <Outlet />
        <TanStackRouterDevtools />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60"></header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </>
  );
}
