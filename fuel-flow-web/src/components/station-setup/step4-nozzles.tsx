import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getFuelTanksByStation,
  getFuelNozzlesByStation,
  createFuelNozzle,
} from "@/lib/api/stations";

type Step4NozzlesProps = {
  stationId: string;
  onNext: () => void;
  onBack: () => void;
};

export function Step4Nozzles({ stationId, onNext, onBack }: Step4NozzlesProps) {
  // Store
  const queryClient = useQueryClient();

  // Queries
  const { data: tanksData } = useQuery({
    queryKey: ["stations", stationId, "fuel-tanks"],
    queryFn: () => getFuelTanksByStation(stationId),
    enabled: !!stationId,
  });
  const { data: nozzlesData, isLoading, error } = useQuery({
    queryKey: ["stations", stationId, "fuel-nozzles"],
    queryFn: () => getFuelNozzlesByStation(stationId),
    enabled: !!stationId,
  });
  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: { tankId: string; nozzleNumber: string }) =>
      createFuelNozzle(stationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations", stationId, "fuel-nozzles"] });
      toast.success("Nozzle added.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to add nozzle.");
    },
  });

  // Local state
  const [tankId, setTankId] = useState("");
  const [nozzleNumber, setNozzleNumber] = useState("");

  // Derived data
  const tanks = tanksData?.data ?? [];
  const nozzles = nozzlesData?.data ?? [];

  // Handlers
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = nozzleNumber.trim();
    if (!tankId || !num) {
      toast.error("Select tank and enter nozzle number.");
      return;
    }
    createMutation.mutate(
      { tankId, nozzleNumber: num },
      {
        onSuccess: () => {
          setTankId("");
          setNozzleNumber("");
        },
      }
    );
  };

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load nozzles. {String(error)}</p>
        </CardContent>
      </Card>
    );
  }

  // Render
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nozzles</CardTitle>
        <CardDescription>
          Map nozzles to tanks. Each nozzle is saved immediately and the list updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading nozzles…</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm">
            {nozzles.map((n) => (
              <li key={n.id}>
                Nozzle {n.nozzleNumber} → {n.tankName ?? n.tankId}
              </li>
            ))}
            {nozzles.length === 0 && (
              <li className="text-muted-foreground">No nozzles yet.</li>
            )}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Tank</Label>
            <select
              value={tankId}
              onChange={(e) => setTankId(e.target.value)}
              disabled={createMutation.isPending}
              className="flex h-9 w-44 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select tank</option>
              {tanks.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.fuelTypeName || t.id}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nozzle-num">Nozzle number</Label>
            <Input
              id="nozzle-num"
              value={nozzleNumber}
              onChange={(e) => setNozzleNumber(e.target.value)}
              placeholder="e.g. 1"
              disabled={createMutation.isPending}
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            Add nozzle
          </Button>
        </form>
        {createMutation.isError && (
          <p className="text-sm text-destructive">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "Add failed."}
          </p>
        )}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
}

