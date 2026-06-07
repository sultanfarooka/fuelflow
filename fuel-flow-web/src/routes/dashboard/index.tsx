import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Building2, ChevronRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/dashboard/")({
  // [M07-F06] Single-station shortcut — bypass the org hub and go straight to the station dashboard.
  beforeLoad: () => {
    const { stations } = useAuthStore.getState()
    if (stations?.length === 1 && stations[0].isSetupComplete) {
      throw redirect({ to: "/dashboard/station/$stationId", params: { stationId: stations[0].id } })
    }
  },
  component: OrganizationDashboardPage,
});

function OrganizationDashboardPage() {
  const { organization, stations } = useAuthStore();

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {organization?.name ?? "Organization"}
        </h1>
        <p className="text-muted-foreground">
          Select a station to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stations?.map((station) => (
          <Link
            key={station.id}
            to="/dashboard/station/$stationId"
            params={{ stationId: station.id }}
            className="group block transition-opacity hover:opacity-90"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{station.name}</CardTitle>
                    <CardDescription>Station</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View dashboard, shifts, inventory, and reports for this station.
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
