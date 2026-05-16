import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  getFuelTypesByStation,
  getFuelTanksByStation,
  createFuelTank,
  deleteFuelTank,
  uploadDipChart,
  getDipChart,
  type FuelTypeDto,
  type FuelTankDto,
  type DipChartDto,
  type DipChartEntryDto,
  type UploadDipChartEntry,
  type CreateFuelTankApiResponse,
} from "@/lib/api/stations";

type Step3TanksProps = {
  stationId: string;
  onNext: () => void;
  onBack: () => void;
};

export function Step3Tanks({ stationId, onNext, onBack }: Step3TanksProps) {
  const queryClient = useQueryClient();

  const { data: typesData } = useQuery({
    queryKey: ["stations", stationId, "fuel-types"],
    queryFn: () => getFuelTypesByStation(stationId),
    enabled: !!stationId,
  });
  const {
    data: tanksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["stations", stationId, "fuel-tanks"],
    queryFn: () => getFuelTanksByStation(stationId),
    enabled: !!stationId,
  });

  const invalidateTanks = () =>
    queryClient.invalidateQueries({
      queryKey: ["stations", stationId, "fuel-tanks"],
    });

  const createMutation = useMutation<
    CreateFuelTankApiResponse,
    Error,
    { fuelTypeId: string; name?: string; capacityLiters: number }
  >({
    mutationFn: (payload) => createFuelTank(stationId, payload),
    onSuccess: async (res) => {
      const tankId = res.data.id;
      try {
        await uploadDipChart(stationId, tankId, { entries: newDipEntries });
        toast.success("Tank and dip chart added.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save dip chart.";
        toast.error(message);
      } finally {
        invalidateTanks();
        setFuelTypeId("");
        setName("");
        setCapacity("");
        setNewDipFileName("");
        setNewDipEntries([]);
        setNewDipErrors([]);
        setNewDipInputKey((k) => k + 1);
        setNextError("");
        setAddError("");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to add tank.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tankId: string) => deleteFuelTank(stationId, tankId),
    onSuccess: () => {
      invalidateTanks();
      toast.success("Tank removed.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to remove tank.");
    },
  });

  const [fuelTypeId, setFuelTypeId] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [newDipFileName, setNewDipFileName] = useState("");
  const [newDipEntries, setNewDipEntries] = useState<UploadDipChartEntry[]>([]);
  const [newDipErrors, setNewDipErrors] = useState<string[]>([]);
  const [newDipInputKey, setNewDipInputKey] = useState(0);
  const [addError, setAddError] = useState("");
  const [nextError, setNextError] = useState("");
  const [dipTank, setDipTank] = useState<FuelTankDto | null>(null);
  const [dipChart, setDipChart] = useState<DipChartDto | null>(null);
  const [isLoadingDipChart, setIsLoadingDipChart] = useState(false);

  const fuelTypes = typesData?.data ?? [];
  const tanks: FuelTankDto[] = tanksData?.data ?? [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseFloat(capacity);
    if (!fuelTypeId) {
      setAddError("Select a product type.");
      return;
    }
    if (!name.trim()) {
      setAddError("Tank name is required.");
      return;
    }
    if (!Number.isFinite(cap) || cap <= 0) {
      setAddError("Enter a valid capacity greater than 0.");
      return;
    }
    if (newDipEntries.length === 0) {
      setAddError("Upload a dip chart CSV for this tank.");
      return;
    }
    setAddError("");
    createMutation.mutate({
      fuelTypeId,
      name: name.trim() || undefined,
      capacityLiters: cap,
    });
  };

  const handleNext = () => {
    const coveredTypeIds = new Set(tanks.map((t) => t.fuelTypeId));
    const missing = fuelTypes.filter(
      (ft: FuelTypeDto) => !coveredTypeIds.has(ft.id),
    );

    if (missing.length > 0) {
      setNextError(
        `Each fuel type needs at least one tank. Missing: ${missing
          .map((ft: FuelTypeDto) => ft.name)
          .join(", ")}`,
      );
      return;
    }

    setNextError("");
    onNext();
  };

  const handleNewDipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewDipFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { rows, errors } = parseDipChartCsv(text);
      setNewDipEntries(rows);
      setNewDipErrors(errors);
    };
    reader.onerror = () => {
      setNewDipErrors(["Failed to read CSV file."]);
    };
    reader.readAsText(file);
  };

  const handleViewDipChart = async (tank: FuelTankDto) => {
    setDipTank(tank);
    setDipChart(null);
    setIsLoadingDipChart(true);
    try {
      const res = await getDipChart(stationId, tank.id);
      setDipChart(res.data ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dip chart.";
      toast.error(message);
    } finally {
      setIsLoadingDipChart(false);
    }
  };

  const handleCloseDipChart = () => {
    setDipTank(null);
    setDipChart(null);
    setIsLoadingDipChart(false);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Failed to load tanks. {String(error)}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isBusy = createMutation.isPending || deleteMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel tanks</CardTitle>
        <CardDescription>
          Add a tank for every fuel type. Each tank is saved immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tank list */}
        {isLoading ? (
          <p className="text-muted-foreground">Loading tanks…</p>
        ) : tanks.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No tanks yet. Add your first tank below.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tanks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {t.name || "Unnamed tank"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {t.fuelTypeName ?? t.fuelTypeId}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t.capacityLiters.toLocaleString()} L
                    </span>
                    <Badge
                      variant={t.hasDipChart ? "outline" : "secondary"}
                      className={`text-[11px] font-normal ${
                        t.dipChartEntryCount > 0
                          ? "cursor-pointer underline-offset-2 hover:underline"
                          : ""
                      }`}
                      onClick={() =>
                        t.dipChartEntryCount > 0 ? handleViewDipChart(t) : undefined
                      }
                    >
                      {t.dipChartEntryCount > 0
                        ? `${t.dipChartEntryCount} entries`
                        : "No dip chart"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={isBusy}
                  type="button"
                  onClick={() => deleteMutation.mutate(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove tank</span>
                </Button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* View dip chart dialog */}
        {dipTank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-background shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    Dip chart for {dipTank.name || "Unnamed tank"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dipTank.fuelTypeName ?? dipTank.fuelTypeId} ·{" "}
                    {dipTank.capacityLiters.toLocaleString()} L
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  type="button"
                  onClick={handleCloseDipChart}
                >
                  ×
                </Button>
              </div>
              <div className="space-y-3 overflow-y-auto px-4 py-4">
                {isLoadingDipChart ? (
                  <p className="text-xs text-muted-foreground">
                    Loading dip chart entries...
                  </p>
                ) : !dipChart || dipChart.entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No dip chart saved for this tank yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {dipChart.entryCount} entries
                    </p>
                    <div className="max-h-72 overflow-auto rounded-md border">
                      <table className="w-full border-collapse text-xs">
                        <thead className="bg-muted">
                          <tr>
                            <th className="border-b px-2 py-1 text-left">
                              Depth (cm)
                            </th>
                            <th className="border-b px-2 py-1 text-left">
                              Volume (L)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dipChart.entries.map(
                            (row: DipChartEntryDto, index: number) => (
                              <tr key={`${row.id}-${index}`}>
                                <td className="border-b px-2 py-1">
                                  {row.depthCm}
                                </td>
                                <td className="border-b px-2 py-1">
                                  {row.volumeLiters}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end border-t px-4 py-3">
                <Button type="button" variant="outline" onClick={handleCloseDipChart}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full flex flex-col gap-4 sm:flex-row">
              <div className="w-full space-y-2">
                <Label>Product type</Label>
                <Select
                  value={fuelTypeId}
                  onValueChange={setFuelTypeId}
                  disabled={isBusy}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((ft: FuelTypeDto) => (
                      <SelectItem key={ft.id} value={ft.id}>
                        {ft.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="tank-name">Name</Label>
                <Input
                  id="tank-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tank 1"
                  disabled={isBusy}
                />
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="tank-cap">Capacity (L)</Label>
                <Input
                  id="tank-cap"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 10000"
                  disabled={isBusy}
                />
              </div>
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="tank-dip-csv">Dip chart CSV</Label>
              <Input
                key={newDipInputKey}
                id="tank-dip-csv"
                type="file"
                accept=".csv,text/csv"
                onChange={handleNewDipFileChange}
                disabled={isBusy}
              />
              <p className="text-xs text-muted-foreground">
                Use the{" "}
                <a
                  href="/dip-chart-sample.csv"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  sample file
                </a>
                . First line may be a comment starting with <code>#</code>, then
                header <code>DepthMm,VolumeLiters</code> and data rows.
              </p>
              {newDipFileName && (
                <p className="text-xs text-muted-foreground">
                  Selected: {newDipFileName}
                </p>
              )}
              {newDipErrors.length > 0 && (
                <ul className="list-inside list-disc text-xs text-destructive">
                  {newDipErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {addError && (
            <Alert
              variant="destructive"
              className="w-full [&>svg+div]:translate-y-0"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{addError}</AlertDescription>
            </Alert>
          )}
          <div className="flex-grow-1 w-full">
            <Button
              type="submit"
              disabled={isBusy}
              className="w-full sm:w-auto float-right"
            >
              + Add tank
            </Button>
          </div>
        </form>

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
          <Button onClick={handleNext}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function parseDipChartCsv(text: string): {
  rows: UploadDipChartEntry[];
  errors: string[];
} {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const rows: UploadDipChartEntry[] = [];
  const errors: string[] = [];

  const nonEmpty = lines.filter((l) => l.length > 0);
  if (!nonEmpty.length) return { rows, errors };

  const [first, ...rest] = nonEmpty;
  const hasCommentLine = first.startsWith("#");
  const headerLine = hasCommentLine ? rest[0] : first;
  const dataLines = hasCommentLine ? rest.slice(1) : rest;
  const headerRowIndex = hasCommentLine ? 2 : 1;

  const expectedHeader = ["DepthMm", "VolumeLiters"];
  const headerParts = headerLine.split(",").map((p) => p.trim());

  if (
    headerParts.length < 2 ||
    headerParts[0] !== expectedHeader[0] ||
    headerParts[1] !== expectedHeader[1]
  ) {
    errors.push(
      `Invalid header. Expected: ${expectedHeader.join(",")} (case sensitive).`,
    );
    return { rows, errors };
  }

  dataLines.forEach((line, index) => {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) {
      errors.push(
        `Row ${headerRowIndex + index + 1}: expected at least 2 columns, got ${parts.length}`,
      );
      return;
    }
    const depthMm = Number(parts[0]);
    const vol = Number(parts[1]);
    if (!Number.isFinite(depthMm) || !Number.isFinite(vol)) {
      errors.push(
        `Row ${headerRowIndex + index + 1}: invalid depth or volume number`,
      );
      return;
    }
    const depthCm = depthMm / 10;
    rows.push({ depthCm, volumeLiters: vol });
  });

  return { rows, errors };
}
