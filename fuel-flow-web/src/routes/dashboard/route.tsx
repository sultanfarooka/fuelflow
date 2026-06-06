import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const { isAuthenticated, organization, stations, devBypassActive } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/auth/login", search: { redirect: "/dashboard" } });
    }
    // No org or setup not yet complete → back to onboarding wizard,
    // unless [M12-F02-R02] dev bypass is active (Development-only flag,
    // hard-gated to IHostEnvironment.IsDevelopment() on the backend).
    if (!devBypassActive && (!organization || !stations?.[0]?.isSetupComplete)) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: AppShell,
});
