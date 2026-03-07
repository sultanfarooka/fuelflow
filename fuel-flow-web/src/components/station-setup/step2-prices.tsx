/**
 * Station setup – Step 2: Set prices.
 *
 * User sets a price per unit for each product type. Each row manages its own
 * save mutation so errors are scoped per row. Next is always enabled; validation
 * runs on click and shows an alert if not every product type has a price.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Banknote } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getFuelTypesByStation,
  getFuelPricesByStation,
  type FuelTypeDto,
  type FuelPricesDto,
} from "@/lib/api/stations";
import { PriceRow } from "./price-row";

type Step2PricesProps = {
  /** Current station ID (from route). */
  stationId: string;
  /** Called when user clicks Next (after validation). */
  onNext: () => void;
  /** Called when user clicks Back. */
  onBack: () => void;
};

export function Step2Prices({ stationId, onNext, onBack }: Step2PricesProps) {
  // ─── Store / context ─────────────────────────────────────────────────────
  const queryClient = useQueryClient();

  // ─── Queries ───────────────────────────────────────────────────────────
  /** Product types for this station (from Step 1). */
  const { data: typesData, error: typesError } = useQuery({
    queryKey: ["stations", stationId, "fuel-types"],
    queryFn: () => getFuelTypesByStation(stationId),
    enabled: !!stationId,
  });
  /** Current prices per product type. */
  const { data: pricesData, error: pricesError } = useQuery({
    queryKey: ["stations", stationId, "fuel-prices"],
    queryFn: () => getFuelPricesByStation(stationId),
    enabled: !!stationId,
  });

  // ─── Local state ───────────────────────────────────────────────────────
  /** Shown in footer when user clicks Next without setting all prices. */
  const [nextError, setNextError] = useState("");

  // ─── Derived data ─────────────────────────────────────────────────────
  const fuelTypes: FuelTypeDto[] = typesData?.data ?? [];
  const prices: FuelPricesDto[] = pricesData?.data ?? [];
  const priceByTypeId = new Map(
    prices.map((p: FuelPricesDto) => [p.fuelTypeId, p]),
  );
  const effectiveFrom = new Date().toISOString().slice(0, 10);

  // ─── Handlers ─────────────────────────────────────────────────────────
  /** Refetch prices then validate all prices set before advancing. */
  const handleNext = async () => {
    if (fuelTypes.length === 0) {
      setNextError("Add product types in the previous step first.");
      return;
    }
    // Refetch to ensure we have the latest data before validating
    const freshPrices = await queryClient.fetchQuery({
      queryKey: ["stations", stationId, "fuel-prices"],
      queryFn: () => getFuelPricesByStation(stationId),
    });
    const freshList = freshPrices?.data ?? [];
    const freshMap = new Map(freshList.map((p: FuelPricesDto) => [p.fuelTypeId, p]));
    const allSet = fuelTypes.every((ft) => freshMap.has(ft.id));

    if (!allSet) {
      setNextError("Set a price for every product type to continue.");
      return;
    }
    setNextError("");
    onNext();
  };

  // ─── Error state (blocking) ─────────────────────────────────────────────
  const error = typesError ?? pricesError;
  if (error) {
    return (
      <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load product types or prices. {String(error)}
        </AlertDescription>
      </Alert>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="space-y-1.5 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Banknote className="h-5 w-5 shrink-0" />
          Set prices
        </CardTitle>
        <CardDescription>
          Set a price per unit for each product type. Save each row individually;
          you can edit a saved price at any time.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6">
        {fuelTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No product types. Go back and add at least one.
          </p>
        ) : (
          <ul className="space-y-2">
            {fuelTypes.map((ft) => (
              <PriceRow
                key={ft.id}
                stationId={stationId}
                fuelType={ft}
                savedPrice={priceByTypeId.get(ft.id)}
                effectiveFrom={effectiveFrom}
              />
            ))}
          </ul>
        )}
      </CardContent>

      {/* Footer: next-step validation error (if any) + Back / Next */}
      <CardFooter className="flex-col gap-3 px-4 sm:px-6">
        {nextError && (
          <Alert
            variant="destructive"
            className="w-full [&>svg+div]:translate-y-0"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{nextError}</AlertDescription>
          </Alert>
        )}
        <div className="flex w-full justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
