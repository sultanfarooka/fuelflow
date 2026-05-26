import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Fuel } from "lucide-react";

import { LanguageSwitch } from "@/components/language-switch";
import { ModeToggle } from "@/components/dark-mode-toggle";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingLayout,
});

function OnboardingLayout() {
  const { user } = useAuthStore();

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? undefined);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">
              Fuel Flow
            </span>
            <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Onboarding
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                  {initials}
                </div>
                <div className="flex flex-col">
                  <span className="max-w-40 truncate font-medium text-foreground">
                    {user.fullName}
                  </span>
                  <span className="max-w-40 truncate text-[10px] text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            )}
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

