import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Plus, Trash2 } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getFuelTanksByStation,
  getFuelNozzlesByStation,
  createFuelNozzle,
  deleteFuelNozzle,
  type FuelTankDto,
} from "@/lib/api/stations";

type Step4NozzlesProps = {
  stationId: string;
  onFinish: () => void;
  onBack: () => void;
};

export function Step4Nozzles({ stationId, onFinish, onBack }: Step4NozzlesProps) {
  // Store
  const queryClient = useQueryClient();

  // Queries
  const { data: tanksData } = useQuery({
    queryKey: ["stations", stationId, "fuel-tanks"],
    queryFn: () => getFuelTanksByStation(stationId),
    enabled: !!stationId,
  });
  const {
    data: nozzlesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["stations", stationId, "fuel-nozzles"],
    queryFn: () => getFuelNozzlesByStation(stationId),
    enabled: !!stationId,
  });
  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: { tankId: string; nozzleNumber: string }) =>
      createFuelNozzle(stationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stations", stationId, "fuel-nozzles"],
      });
      toast.success("Nozzle added.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to add nozzle.");
    },
  });

  // Local state
  const [tankId, setTankId] = useState("");
  const [nozzleNumber, setNozzleNumber] = useState("");
  const [addError, setAddError] = useState("");
  const [nextError, setNextError] = useState("");

  // Derived data
  const tanks: FuelTankDto[] = tanksData?.data ?? [];
  const nozzles = nozzlesData?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (nozzleId: string) => deleteFuelNozzle(stationId, nozzleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stations", stationId, "fuel-nozzles"],
      });
      toast.success("Nozzle removed.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to remove nozzle.");
    },
  });

  // Handlers
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = nozzleNumber.trim();
    if (!tankId) {
      setAddError("Select a tank.");
      return;
    }
    if (!num) {
      setAddError("Enter a nozzle name/number.");
      return;
    }
    setAddError("");
    createMutation.mutate(
      { tankId, nozzleNumber: num },
      {
        onSuccess: () => {
          setTankId("");
          setNozzleNumber("");
          setAddError("");
          setNextError("");
        },
      },
    );
  };

  const handleNext = async () => {
    if (tanks.length === 0) {
      setNextError("Add at least one tank in the previous step first.");
      return;
    }

    // Refetch nozzles to ensure we validate against latest data
    const freshNozzles = await queryClient.fetchQuery({
      queryKey: ["stations", stationId, "fuel-nozzles"],
      queryFn: () => getFuelNozzlesByStation(stationId),
    });
    const freshList = freshNozzles?.data ?? [];

    const tanksWithoutNozzle = tanks.filter(
      (t) => !freshList.some((n: { tankId: string }) => n.tankId === t.id),
    );

    if (tanksWithoutNozzle.length > 0) {
      const names = tanksWithoutNozzle
        .map((t) => t.name || t.fuelTypeName || t.id)
        .join(", ");
      setNextError(`Add at least one nozzle for every tank. Missing: ${names}`);
      return;
    }

    setNextError("");
    onFinish();
  };

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Failed to load nozzles. {String(error)}
          </p>
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
          Map nozzles to tanks. Each nozzle is saved immediately and the list
          updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading nozzles…</p>
        ) : nozzles.length === 0 && tanks.length > 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No nozzles yet. Add your first nozzle below.
          </div>
        ) : nozzles.length === 0 && tanks.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No tanks available. Add tanks in the previous step first.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {nozzles.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Nozzle {n.nozzleNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tank: {n.tankName ?? n.tankId}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={createMutation.isPending || deleteMutation.isPending}
                  type="button"
                  onClick={() => deleteMutation.mutate(n.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove nozzle</span>
                </Button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full flex flex-col gap-4 sm:flex-row">
              <div className="w-full space-y-2">
                <Label>Tank</Label>
                <Select
                  value={tankId}
                  onValueChange={setTankId}
                  disabled={createMutation.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tank" />
                  </SelectTrigger>
                  <SelectContent>
                    {tanks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name || t.fuelTypeName || t.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="nozzle-num">Nozzle name / number</Label>
                <Input
                  id="nozzle-num"
                  value={nozzleNumber}
                  onChange={(e) => setNozzleNumber(e.target.value)}
                  placeholder="e.g. A1 or A.1"
                  disabled={createMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Hint: Include the dispenser prefix in the name. For example,
                  Dispenser A nozzle 1 can be written as <code>A1</code> or{" "}
                  <code>A.1</code>.
                </p>
              </div>
            </div>
          </div>
          <div className="grow w-full">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full sm:w-auto float-right"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add nozzle
            </Button>
          </div>
        </form>

        {addError && (
          <Alert
            variant="destructive"
            className="w-full [&>svg+div]:translate-y-0"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{addError}</AlertDescription>
          </Alert>
        )}

        {createMutation.isError && (
          <Alert
            variant="destructive"
            className="w-full [&>svg+div]:translate-y-0"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Add failed."}
            </AlertDescription>
          </Alert>
        )}

        {nextError && (
          <Alert
            variant="destructive"
            className="w-full [&>svg+div]:translate-y-0"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{nextError}</AlertDescription>
          </Alert>
        )}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext}>Finish setup</Button>
        </div>
      </CardContent>
    </Card>
  );
}
