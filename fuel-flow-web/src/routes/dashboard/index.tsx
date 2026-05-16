import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getOMCs, type OMC } from "@/lib/api/omcs";
import { createStation, type CreateStationRequest } from "@/lib/api/station-management";
import { getCurrentUser } from "@/lib/api/auth/me";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/dashboard/")({
  component: OrganizationDashboardPage,
});

function OrganizationDashboardPage() {
  const { organization, stations, setAuthState } = useAuthStore();
  const [name, setName] = useState("");
  const [omcId, setOmcId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");

  const { data: omcResponse, isLoading: isLoadingOmcs } = useQuery({
    queryKey: ["omcs"],
    queryFn: getOMCs,
    enabled: !stations || stations.length === 0,
  });
  const omcs: OMC[] = omcResponse?.data ?? [];

  const createStationMutation = useMutation({
    mutationFn: async (payload: CreateStationRequest) => {
      const response = await createStation(payload);
      const me = await getCurrentUser();
      setAuthState(me.data);
      return response;
    },
    onSuccess: () => {
      toast.success("Station created successfully.");
      setName("");
      setOmcId("");
      setAddress("");
      setPhone("");
      setFormError("");
    },
    onError: (error: unknown) => {
      const axiosErr = error as {
        response?: { data?: { title?: string; detail?: string; errors?: Record<string, string[]> } };
        message?: string;
      } | null;
      if (axiosErr?.response?.data) {
        const data = axiosErr.response.data;
        const fieldMessages =
          data.errors &&
          Object.values(data.errors)
            .flat()
            .filter(Boolean);
        const message =
          (fieldMessages && fieldMessages[0]) ||
          data.detail ||
          data.title ||
          "Failed to create station.";
        setFormError(message);
      } else {
        const message =
          error instanceof Error ? error.message : "Failed to create station.";
        setFormError(message);
      }
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !omcId) {
      setFormError("Station name and OMC are required.");
      return;
    }
    const payload: CreateStationRequest = {
      name: name.trim(),
      omcId,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
    };
    createStationMutation.mutate(payload);
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {organization?.name ?? "Organization"}
        </h1>
        <p className="text-muted-foreground">
          Select a station to view its dashboard and manage operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stations?.length ? (
          stations.map((station) => (
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
                    View dashboard, shifts, inventory, and reports for this
                    station.
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>No stations yet</CardTitle>
              <CardDescription>
                Your organization has no stations. Add your first station below to start using the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="station-name">Station name</Label>
                    <Input
                      id="station-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. FF Johar Town"
                      autoComplete="off"
                      disabled={createStationMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station-omc">OMC</Label>
                    <select
                      id="station-omc"
                      value={omcId}
                      onChange={(e) => setOmcId(e.target.value)}
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isLoadingOmcs || createStationMutation.isPending}
                    >
                      <option value="">
                        {isLoadingOmcs ? "Loading OMCs..." : "Select OMC"}
                      </option>
                      {omcs.map((omc) => (
                        <option key={omc.id} value={omc.id}>
                          {omc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="station-address">Station address (optional)</Label>
                    <Input
                      id="station-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, area, city"
                      autoComplete="street-address"
                      disabled={createStationMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station-phone">Contact phone (optional)</Label>
                    <Input
                      id="station-phone"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92XXXXXXXXXX"
                      autoComplete="tel"
                      disabled={createStationMutation.isPending}
                    />
                  </div>
                </div>
                {formError && (
                  <Alert
                    variant="destructive"
                    className="w-full [&>svg+div]:translate-y-0"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      createStationMutation.isPending ||
                      isLoadingOmcs ||
                      !omcs.length
                    }
                  >
                    {createStationMutation.isPending ? "Creating..." : "Create station"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
