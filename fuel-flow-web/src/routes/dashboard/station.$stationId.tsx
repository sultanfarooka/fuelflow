import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fuel, Gauge, BarChart3, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getFuelTanksByStation,
  getFuelNozzlesByStation,
} from "@/lib/api/stations";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/dashboard/station/$stationId")({
  beforeLoad: ({ params, location }) => {
    const { isAuthenticated, organization, stations } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/station/${params.stationId}` },
      });
    }
    if (!organization) {
      throw redirect({ to: "/onboarding" });
    }
    const station = stations?.find((s) => s.id === params.stationId);
    if (!station && (stations?.length ?? 0) > 0) {
      throw redirect({ to: "/dashboard" });
    }
    if (
      station &&
      station.isSetupComplete === false &&
      !location.pathname.endsWith("/setup")
    ) {
      throw redirect({
        to: "/dashboard/station/$stationId/setup",
        params: { stationId: params.stationId },
      });
    }
  },
  component: StationDashboardPage,
});

// Render child routes (setup, shifts, nozzles, etc.) via Outlet; fall back to
// the station overview when the URL is exactly the station root.
function StationDashboardPage() {
  const { stationId } = Route.useParams();
  const { location } = useRouterState();
  const isStationRoot =
    location.pathname === `/dashboard/station/${stationId}` ||
    location.pathname === `/dashboard/station/${stationId}/`;
  if (isStationRoot) {
    return <StationDashboardContent />;
  }
  return <Outlet />;
}

function StationDashboardContent() {
  const { stationId } = Route.useParams();
  const { stations } = useAuthStore();
  const station = stations?.find((s) => s.id === stationId);

  // Station setup flow: if no tanks and no nozzles, show setup CTA and link to /setup; otherwise show normal dashboard.
  const {
    data: tanksData,
    isLoading: isLoadingTanks,
    error: tanksError,
  } = useQuery({
    queryKey: ["stations", stationId, "fuel-tanks"],
    queryFn: () => getFuelTanksByStation(stationId),
    enabled: !!stationId,
  });
  const {
    data: nozzlesData,
    isLoading: isLoadingNozzles,
    error: nozzlesError,
  } = useQuery({
    queryKey: ["stations", stationId, "fuel-nozzles"],
    queryFn: () => getFuelNozzlesByStation(stationId),
    enabled: !!stationId,
  });

  const tanks = tanksData?.data ?? [];
  const nozzles = nozzlesData?.data ?? [];
  const isLoading = isLoadingTanks || isLoadingNozzles;
  const hasTanks = tanks.length > 0;
  const hasNozzles = nozzles.length > 0;
  const needsSetup = !isLoading && !hasTanks && !hasNozzles;
  const error = tanksError ?? nozzlesError;

  if (!station) {
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load station data.{" "}
          {error instanceof Error ? error.message : "Please try again."}
        </div>
        <Link to="/dashboard">
          <Button variant="outline">Back to organization</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{station.name}</h1>
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{station.name}</h1>
          <p className="text-muted-foreground">
            Add tanks and nozzles to start tracking inventory and shifts.
          </p>
        </div>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Set up this station
            </CardTitle>
            <CardDescription>
              Configure fuel types, prices, tanks, and nozzles so you can run
              shifts and record sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/dashboard/station/$stationId/setup"
              params={{ stationId }}
            >
              <Button>Start setup</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{station.name}</h1>
        <p className="text-muted-foreground">
          Station dashboard — overview, shifts, and quick actions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Today&apos;s sales
            </CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active shift</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Station overview</CardTitle>
          <CardDescription>
            Inventory, nozzle readings, and shift management will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is the dashboard for <strong>{station.name}</strong>. Content
            and modules will be added as features are built.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
