import { useState } from "react";
import { Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getFuelTypesByStation } from "@/lib/api/stations/fuel-types";
import {
  getFuelPricesByStation,
  setFuelPrice,
} from "@/lib/api/stations/fuel-prices";

interface Props {
  stationId: string;
  onNext: () => void;
  onBack: () => void;
}

function priceLabelForUnit(unit: string, t: (key: string) => string) {
  return unit === "kg"
    ? t("onboarding.step3.pricePerKg")
    : t("onboarding.step3.pricePerLiter");
}

export function StepPrices({ stationId, onNext, onBack }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: typesRes } = useQuery({
    queryKey: ["fuel-types", stationId],
    queryFn: () => getFuelTypesByStation(stationId),
  });
  const fuelTypes = typesRes?.data ?? [];

  const { data: pricesRes } = useQuery({
    queryKey: ["fuel-prices", stationId],
    queryFn: () => getFuelPricesByStation(stationId),
  });
  const existingPrices = pricesRes?.data ?? [];

  const [prices, setPrices] = useState<Record<string, string>>({});

  const getInitialPrice = (fuelTypeId: string) => {
    const existing = existingPrices.find((p) => p.fuelTypeId === fuelTypeId);
    return existing ? String(existing.price) : (prices[fuelTypeId] ?? "");
  };

  const priceMutation = useMutation({
    mutationFn: ({
      fuelTypeId,
      price,
    }: {
      fuelTypeId: string;
      price: number;
    }) =>
      setFuelPrice(stationId, {
        fuelTypeId,
        price,
        effectiveFrom: new Date().toISOString(),
      }),
    onSuccess: (_, vars) => {
      setSaveError(null);
      setSavedIds((prev) => new Set(prev).add(vars.fuelTypeId));
      queryClient.invalidateQueries({ queryKey: ["fuel-prices", stationId] });
    },
    onError: () => {
      const msg = t("onboarding.step3.saveError");
      setSaveError(msg);
      toast.error(msg);
    },
  });

  const handleBlur = async (fuelTypeId: string) => {
    const raw = prices[fuelTypeId] ?? getInitialPrice(fuelTypeId);
    const parsed = parseFloat(raw);
    if (!raw || isNaN(parsed) || parsed <= 0) return;
    await priceMutation.mutateAsync({ fuelTypeId, price: parsed });
  };

  const handleNext = () => {
    const allSaved = fuelTypes.every(
      (ft) =>
        savedIds.has(ft.id) ||
        existingPrices.some((p) => p.fuelTypeId === ft.id),
    );
    if (!allSaved) {
      setValidationError(t("onboarding.step3.validationError"));
      return;
    }
    setValidationError(null);
    onNext();
  };

  const isSavedFor = (fuelTypeId: string) =>
    savedIds.has(fuelTypeId) ||
    existingPrices.some((p) => p.fuelTypeId === fuelTypeId);

  const savedCount = fuelTypes.reduce(
    (acc, ft) => acc + (isSavedFor(ft.id) ? 1 : 0),
    0,
  );
  const allSaved =
    fuelTypes.length > 0 && fuelTypes.every((ft) => isSavedFor(ft.id));
  const canContinue = allSaved && !priceMutation.isPending;

  return (
    <div className="space-y-6">
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("onboarding.steps.3.title")}</CardTitle>
          <CardDescription>
            {t("onboarding.steps.3.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fuelTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("onboarding.step3.noFuelTypes")}
            </p>
          ) : (
            fuelTypes.map((ft) => {
              const saved = isSavedFor(ft.id);
              const currentVal = prices[ft.id] ?? getInitialPrice(ft.id);

              return (
                <div
                  key={ft.id}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border border-border p-4 transition-colors",
                    saved && "border-primary/30 bg-primary/5",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{ft.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-sm font-medium text-muted-foreground">
                      {priceLabelForUnit(ft.unit, t)}
                    </span>
                    <Input
                      type="number"
                      size="lg"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={currentVal}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          [ft.id]: e.target.value,
                        }))
                      }
                      onBlur={() => handleBlur(ft.id)}
                      className="w-28 text-end"
                      min={0}
                    />
                    {saved && (
                      <Check
                        className="size-4 shrink-0 text-success"
                        aria-label={t("onboarding.step3.saved")}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
        <CardFooter className="border-t border-border">
          <p
            className={cn(
              "text-sm",
              fuelTypes.length === 0
                ? "text-muted-foreground"
                : "text-foreground",
            )}
          >
            {fuelTypes.length === 0
              ? t("onboarding.step3.noFuelTypes")
              : t("onboarding.step3.savedProgress", {
                  saved: savedCount,
                  total: fuelTypes.length,
                })}
          </p>
        </CardFooter>
      </Card>

      {validationError && (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-10 px-4 text-sm"
        >
          {t("onboarding.actions.back")}
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canContinue}
          className="h-10 px-4 text-sm"
        >
          {t("onboarding.actions.continue")}
        </Button>
      </div>
    </div>
  );
}
