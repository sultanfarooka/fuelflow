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

  if (isAuthRoute || isOnboardingRoute || isDashboardRoute) {
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
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"></header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </>
  );
}
