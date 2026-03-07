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
  getFuelTypesByStation,
  getFuelTanksByStation,
  createFuelTank,
} from "@/lib/api/stations";

type Step3TanksProps = {
  stationId: string;
  onNext: () => void;
  onBack: () => void;
};

export function Step3Tanks({ stationId, onNext, onBack }: Step3TanksProps) {
  // Store
  const queryClient = useQueryClient();

  // Queries
  const { data: typesData } = useQuery({
    queryKey: ["stations", stationId, "fuel-types"],
    queryFn: () => getFuelTypesByStation(stationId),
    enabled: !!stationId,
  });
  const { data: tanksData, isLoading, error } = useQuery({
    queryKey: ["stations", stationId, "fuel-tanks"],
    queryFn: () => getFuelTanksByStation(stationId),
    enabled: !!stationId,
  });
  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: { fuelTypeId: string; name?: string; capacityLiters: number }) =>
      createFuelTank(stationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations", stationId, "fuel-tanks"] });
      toast.success("Tank added.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to add tank.");
    },
  });

  // Local state
  const [fuelTypeId, setFuelTypeId] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");

  // Derived data
  const fuelTypes = typesData?.data ?? [];
  const tanks = tanksData?.data ?? [];

  // Handlers
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseFloat(capacity);
    if (!fuelTypeId || !Number.isFinite(cap) || cap <= 0) {
      toast.error("Select product type and enter a valid capacity.");
      return;
    }
    createMutation.mutate(
      { fuelTypeId, name: name.trim() || undefined, capacityLiters: cap },
      {
        onSuccess: () => {
          setFuelTypeId("");
          setName("");
          setCapacity("");
        },
      }
    );
  };

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load tanks. {String(error)}</p>
        </CardContent>
      </Card>
    );
  }

  // Render
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel tanks</CardTitle>
        <CardDescription>
          Add tanks; each tank is saved immediately and the list updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading tanks…</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm">
            {tanks.map((t) => (
              <li key={t.id}>
                {t.name || "Tank"} — {t.fuelTypeName ?? t.fuelTypeId}, {t.capacityLiters} L
              </li>
            ))}
            {tanks.length === 0 && (
              <li className="text-muted-foreground">No tanks yet.</li>
            )}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Product type</Label>
            <select
              value={fuelTypeId}
              onChange={(e) => setFuelTypeId(e.target.value)}
              disabled={createMutation.isPending}
              className="flex h-9 w-44 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select type</option>
              {fuelTypes.map((ft: any) => (
                <option key={ft.id} value={ft.id}>
                  {ft.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tank-name">Name (optional)</Label>
            <Input
              id="tank-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tank 1"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tank-cap">Capacity (L)</Label>
            <Input
              id="tank-cap"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 10000"
              disabled={createMutation.isPending}
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            Add tank
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

