import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Fuel } from "lucide-react";

import { LanguageSwitch } from "@/components/language-switch";
import { ModeToggle } from "@/components/dark-mode-toggle";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">
              Fuel Flow
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
