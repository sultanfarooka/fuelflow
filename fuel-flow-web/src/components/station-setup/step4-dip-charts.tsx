import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import {
  getFuelTanksByStation,
  uploadDipChart,
  type FuelTankDto,
  type UploadDipChartEntry,
} from "@/lib/api/stations";

type Step4DipChartsProps = {
  stationId: string;
  onNext: () => void;
  onBack: () => void;
};

type View = "list" | "upload";

export function Step4DipCharts({
  stationId,
  onNext,
  onBack,
}: Step4DipChartsProps) {
  const queryClient = useQueryClient();

  const { data: tanksData, isLoading, error } = useQuery({
    queryKey: ["stations", stationId, "fuel-tanks"],
    queryFn: () => getFuelTanksByStation(stationId),
    enabled: !!stationId,
  });

  const [view, setView] = useState<View>("list");
  const [selectedTank, setSelectedTank] = useState<FuelTankDto | null>(null);
  const [fileName, setFileName] = useState("");
  const [entries, setEntries] = useState<UploadDipChartEntry[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const tanks: FuelTankDto[] = tanksData?.data ?? [];

  const invalidateTanks = () =>
    queryClient.invalidateQueries({
      queryKey: ["stations", stationId, "fuel-tanks"],
    });

  const uploadMutation = useMutation({
    mutationFn: (vars: { tankId: string; rows: UploadDipChartEntry[] }) =>
      uploadDipChart(stationId, vars.tankId, { entries: vars.rows }),
    onSuccess: () => {
      invalidateTanks();
      toast.success("Dip chart saved.");
      resetUploadState();
      setView("list");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save dip chart.");
    },
  });

  const resetUploadState = () => {
    setFileName("");
    setEntries([]);
    setParseErrors([]);
    setSelectedTank(null);
  };

  const handleSelectTank = (tank: FuelTankDto) => {
    setSelectedTank(tank);
    setView("upload");
    setFileName("");
    setEntries([]);
    setParseErrors([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { rows, errors } = parseDipChartCsv(text);
      setEntries(rows);
      setParseErrors(errors);
      if (!errors.length && !rows.length) {
        toast.error("No valid rows found in CSV.");
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read CSV file.");
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    if (!selectedTank) return;
    if (!entries.length) {
      toast.error("Add at least one row before saving.");
      return;
    }
    uploadMutation.mutate({ tankId: selectedTank.id, rows: entries });
  };

  const handleNextClick = () => {
    onNext();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dip charts</CardTitle>
        <CardDescription>
          Upload a dip chart (depth to volume table) for each tank.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {view === "list" && (
          <>
            {isLoading ? (
              <p className="text-muted-foreground">Loading tanks…</p>
            ) : tanks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tanks found. Add tanks first in the previous step.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {tanks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTank(t)}
                    className="flex flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left transition hover:border-primary/60 hover:shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {t.name || "Unnamed tank"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.fuelTypeName ?? t.fuelTypeId} ·{" "}
                        {t.capacityLiters.toLocaleString()} L
                      </p>
                    </div>
                    <Badge
                      variant={t.hasDipChart ? "outline" : "secondary"}
                      className="text-[11px] font-normal"
                    >
                      {t.dipChartEntryCount > 0
                        ? `${t.dipChartEntryCount} entries`
                        : "No dip chart"}
                    </Badge>
                    <span className="text-xs text-primary">
                      {t.hasDipChart ? "Re-upload dip chart" : "Upload dip chart"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={handleNextClick}>Next</Button>
            </div>
          </>
        )}

        {view === "upload" && selectedTank && (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {selectedTank.name || "Unnamed tank"}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedTank.fuelTypeName ?? selectedTank.fuelTypeId} ·{" "}
                {selectedTank.capacityLiters.toLocaleString()} L
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dip-csv">CSV file</Label>
              <Input
                id="dip-csv"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
              />
              {fileName && (
                <p className="text-xs text-muted-foreground">{fileName}</p>
              )}
            </div>

            {parseErrors.length > 0 && (
              <div className="space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive">
                  CSV issues
                </p>
                <ul className="list-inside list-disc text-xs text-destructive">
                  {parseErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {entries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Previewing first {Math.min(entries.length, 20)} of{" "}
                  {entries.length} rows
                </p>
                <div className="max-h-64 overflow-auto rounded-md border">
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
                      {entries.slice(0, 20).map((row, i) => (
                        <tr key={`${row.depthCm}-${row.volumeLiters}-${i}`}>
                          <td className="border-b px-2 py-1">
                            {row.depthCm}
                          </td>
                          <td className="border-b px-2 py-1">
                            {row.volumeLiters}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={uploadMutation.isPending}
                onClick={() => {
                  resetUploadState();
                  setView("list");
                }}
              >
                Back to tanks
              </Button>
              <Button
                type="button"
                disabled={uploadMutation.isPending || entries.length === 0}
                onClick={handleSave}
              >
                {uploadMutation.isPending ? "Saving..." : "Save dip chart"}
              </Button>
            </div>
          </>
        )}
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
  const parseLine = (line: string, index: number) => {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) {
      errors.push(`Row ${index}: expected 2 columns, got ${parts.length}`);
      return;
    }
    const depth = Number(parts[0]);
    const vol = Number(parts[1]);
    if (!Number.isFinite(depth) || !Number.isFinite(vol)) {
      errors.push(`Row ${index}: invalid number(s)`);
      return;
    }
    rows.push({ depthCm: depth, volumeLiters: vol });
  };

  const firstParts = first.split(",").map((p) => p.trim());
  const firstIsHeader =
    firstParts.length >= 2 &&
    (!Number.isFinite(Number(firstParts[0])) ||
      !Number.isFinite(Number(firstParts[1])));

  if (!firstIsHeader) {
    parseLine(first, 1);
  }

  rest.forEach((line, i) => {
    parseLine(line, i + 1 + (firstIsHeader ? 1 : 0));
  });

  return { rows, errors };
}

