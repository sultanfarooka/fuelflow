import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Fuel, LayoutDashboard, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitch } from "@/components/language-switch";
import { ModeToggle } from "@/components/dark-mode-toggle";
import { logout } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const { isAuthenticated, organization } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/auth/login", search: { redirect: "/dashboard" } });
    }
    if (!organization) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, logout: clearAuth } = useAuthStore();
  const { location } = useRouterState();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearAuth();
      window.location.href = "/";
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "?");

  const isOrgDashboard = location.pathname === "/dashboard" || location.pathname === "/dashboard/";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold tracking-tight">
                Fuel Flow
              </span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isOrgDashboard
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Organization
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {initials}
                  </div>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/dashboard"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Organization dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="me-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
