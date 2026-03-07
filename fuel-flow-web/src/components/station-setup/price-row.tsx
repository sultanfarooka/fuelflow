/**
 * PriceRow – single product-type price entry used by Step 2.
 *
 * Each row owns its own mutation so validation errors stay scoped to the row.
 * Two visual states:
 *   - **Editing**: Rs. / unit label next to input + full-width Save button on mobile.
 *   - **Saved**: price displayed inline with "Saved" badge and Edit button.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setFuelPrice,
  type FuelTypeDto,
  type FuelPricesDto,
} from "@/lib/api/stations";

// ─── Props ──────────────────────────────────────────────────────────────────

export type PriceRowProps = {
  stationId: string;
  fuelType: FuelTypeDto;
  savedPrice?: FuelPricesDto;
  effectiveFrom: string;
};

// ─── Component ──────────────────────────────────────────────────────────────

export function PriceRow({
  stationId,
  fuelType,
  savedPrice,
  effectiveFrom,
}: PriceRowProps) {
  // ─── Local state ─────────────────────────────────────────────────────
  const [price, setPrice] = useState("");
  const [rowError, setRowError] = useState("");
  /** True only when the user explicitly clicks Edit on a saved row. */
  const [manualEditing, setManualEditing] = useState(false);

  // ─── Store / context ─────────────────────────────────────────────────
  const queryClient = useQueryClient();

  // ─── Mutation (scoped to this row) ───────────────────────────────────
  const mutation = useMutation({
    mutationFn: (p: number) =>
      setFuelPrice(stationId, {
        fuelTypeId: fuelType.id,
        price: p,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stations", stationId, "fuel-prices"],
      });
      setRowError("");
      setManualEditing(false);
      toast.success(`Price saved for ${fuelType.name}.`);
    },
    onError: (err: Error) => {
      setRowError(err.message ?? "Failed to save price.");
    },
  });

  // ─── Derived data ────────────────────────────────────────────────────
  /**
   * isSaved: true when server has a price AND user hasn't clicked Edit.
   * editing: true when no server price yet, OR user clicked Edit.
   * This is fully derived from props + one boolean, no sync needed.
   */
  const hasSavedPrice = savedPrice != null;
  const isSaved = hasSavedPrice && !manualEditing;
  const editing = !isSaved;
  const effectivePrice = savedPrice?.price ?? null;
  const displayValue = editing ? price : String(effectivePrice ?? "");
  const unitSuffix = fuelType.unit ? ` / ${fuelType.unit}` : "";

  // ─── Handlers ────────────────────────────────────────────────────────
  const startEditing = () => {
    setPrice(String(effectivePrice ?? ""));
    setRowError("");
    setManualEditing(true);
  };

  const handleSave = () => {
    const n = parseFloat(price);
    if (!Number.isFinite(n) || n < 0) {
      setRowError("Enter a valid price.");
      return;
    }
    setRowError("");
    mutation.mutate(n);
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <li className="space-y-2 rounded-lg border p-3 sm:px-4">
      {/* Row 1: product name (left) + saved badge (right) */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{fuelType.name}</span>
        {isSaved && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          </div>
        )}
      </div>

      {/* Row 2: saved price or input (right-aligned) */}
      {isSaved ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-right text-sm sm:text-left">
            <span className="font-semibold">Rs. {effectivePrice}</span>
            <span className="text-muted-foreground">{unitSuffix}</span>
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={startEditing}
            className="w-full sm:w-auto"
          >
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-sm text-muted-foreground">
              Rs.{unitSuffix}
            </span>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={displayValue}
              onChange={(e) => {
                setPrice(e.target.value);
                if (rowError) setRowError("");
              }}
              placeholder="0.00"
              disabled={mutation.isPending}
              className="w-full sm:w-32"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            Save
          </Button>
        </div>
      )}

      {/* Row 3: effective date (right-aligned) */}
      <p className="text-right text-xs text-muted-foreground">
        Effective from {effectiveFrom}
      </p>

      {/* Inline error for this row */}
      {rowError && (
        <p className="text-sm text-destructive float-right">{rowError}</p>
      )}
    </li>
  );
}
