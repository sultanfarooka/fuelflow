import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/design")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: "/" });
    }
  },
  component: DesignLayout,
});

function DesignLayout() {
  const { location } = useRouterState();
  const isRoot = location.pathname === "/design" || location.pathname === "/design/";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 items-center gap-3 px-4">
          <Link to="/design" className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight">Fuel Flow · Design Playground</span>
            <Badge variant="outline" className="text-[10px]">DEV ONLY</Badge>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            {!isRoot ? (
              <Button asChild size="sm" variant="ghost">
                <Link to="/design">All modules</Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link to="/">Back to app</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
