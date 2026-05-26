/**
 * Station setup – Step 1: Product types (fuel types).
 *
 * Lets the user define which product types this station sells by:
 * - Listing already-added types with remove controls
 * - Offering OMC-provided types to add in one click
 * - Allowing custom product types with name + unit (L or kg)
 *
 * Next is always enabled; validation runs on click and shows an alert if no types added.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Check, Fuel, Plus, X } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFuelTypesByStation,
  createFuelType,
  deleteFuelType,
} from "@/lib/api/stations";
import {
  getStationsByOrganization,
  type OrganizationStationDto,
} from "@/lib/api/station-management";
import {
  getOMCFuelTypesByOmc,
  type OMCFuelTypeDto,
} from "@/lib/api/omc-fuel-types";
import { useAuthStore } from "@/stores/auth-store";
import type { createFuelTypePayload } from "@/lib/api/stations/fuel-types";

type Step1FuelTypesProps = {
  /** Current station ID (from route). */
  stationId: string;
  /** Called when user clicks Next (after validation). */
  onNext: () => void;
};

export function Step1FuelTypes({ stationId, onNext }: Step1FuelTypesProps) {
  // ─── Store / context ─────────────────────────────────────────────────────
  const queryClient = useQueryClient();
  const { organization } = useAuthStore();
  const organizationId = organization?.id;

  // ─── Queries ───────────────────────────────────────────────────────────
  /** Station's product types (what we display and allow deleting). */
  const { data, isLoading, error } = useQuery({
    queryKey: ["stations", stationId, "fuel-types"],
    queryFn: () => getFuelTypesByStation(stationId),
    enabled: !!stationId,
  });

  /** Org stations to resolve this station's OMC (needed for OMC product list). */
  const { data: stationsByOrgData } = useQuery({
    queryKey: ["stations", "by-organization", organizationId],
    queryFn: () => getStationsByOrganization(organizationId!),
    enabled: !!organizationId,
  });
  const orgStations: OrganizationStationDto[] = stationsByOrgData?.data ?? [];
  const currentStationMeta = orgStations.find((s) => s.id === stationId);
  const stationOmcId = currentStationMeta?.omcId;

  /** OMC product catalog: types the user can add with one click (unit comes from OMC). */
  const {
    data: omcFuelTypesData,
    isLoading: isLoadingOmcFuelTypes,
    error: omcError,
  } = useQuery({
    queryKey: ["omc-fuel-types", stationOmcId],
    queryFn: () => getOMCFuelTypesByOmc(stationOmcId!),
    enabled: !!stationOmcId,
  });
  const omcFuelTypes: OMCFuelTypeDto[] = omcFuelTypesData?.data ?? [];

  // ─── Mutations ────────────────────────────────────────────────────────
  const createFuelTypeMutaion = useMutation({
    mutationFn: (payload: createFuelTypePayload) =>
      createFuelType(stationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stations", stationId, "fuel-types"],
      });
      setNextError(""); // Clear next-step validation when user adds a type
      toast.success("Product type added.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to add product type.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fuelTypeId: string) => deleteFuelType(stationId, fuelTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stations", stationId, "fuel-types"],
      });
      toast.success("Product type removed.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to remove product type.");
    },
  });

  // ─── Local state ───────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("L");
  /** Shown in footer when user clicks Next with zero product types. */
  const [nextError, setNextError] = useState("");

  // ─── Derived data ─────────────────────────────────────────────────────
  const fuelTypes = data?.data ?? [];
  const omcDisplayName = omcFuelTypes[0]?.omcName ?? "your OMC";
  const isMutating =
    createFuelTypeMutaion.isPending || deleteMutation.isPending;

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      toast.error("Name is required.");
      return;
    }
    createFuelTypeMutaion.mutate(
      { name: n, unit, isCustom: true },
      {
        onSuccess: () => {
          setName("");
          setUnit("L");
        },
      },
    );
  };

  //function to check if omcId is already in the fuelTypes array
  const isOMCFuelTypeAlreadyAdded = (omcId: string) => {
    return fuelTypes.some(
      (ft) => ft.name.toLowerCase() === omcId.toLowerCase(),
    );
  };

  /** Validate at least one product type before advancing; show inline error otherwise. */
  const handleNext = () => {
    if (fuelTypes.length === 0) {
      setNextError("Add at least one product type before proceeding.");
      return;
    }
    setNextError("");
    onNext();
  };

  // ─── Error state (blocking) ─────────────────────────────────────────────
  if (error) {
    return (
      <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load product types. {String(error)}
        </AlertDescription>
      </Alert>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="space-y-1.5 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Fuel className="h-5 w-5 shrink-0" />
          Product types
        </CardTitle>
        <CardDescription>
          Choose which product types this station will sell. Pick from{" "}
          <span className="font-medium text-foreground">{omcDisplayName}</span>{" "}
          products or add your own custom types.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-4 sm:px-6">
        {/* Current station product types: list + remove */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">
            Your station&apos;s product types
          </h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : fuelTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No product types yet. Add from the OMC products below, or create a
              custom type.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {fuelTypes.map((ft) => (
                <Badge
                  key={ft.id}
                  variant="secondary"
                  className="gap-1 py-1.5 ps-3 pe-1.5 text-sm"
                >
                  <span>
                    {ft.name}
                    <span className="ms-1 font-normal text-muted-foreground">
                      ({ft.unit})
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => deleteMutation.mutate(ft.id)}
                    className="ms-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {ft.name}</span>
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* OMC catalog: add product types in one click (unit from OMC) */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">{omcDisplayName} products</h3>
            <p className="text-xs text-muted-foreground">
              These product types are provided by your OMC. Add the ones this
              station sells.
            </p>
          </div>

          {omcError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load OMC product types. {String(omcError)}
              </AlertDescription>
            </Alert>
          ) : isLoadingOmcFuelTypes ? (
            <p className="text-sm text-muted-foreground">
              Loading OMC product types…
            </p>
          ) : stationOmcId ? (
            <div className="space-y-2">
              {omcFuelTypes.map((omcType) => {
                const alreadyAdded = isOMCFuelTypeAlreadyAdded(omcType.id);
                return (
                  <div
                    key={omcType.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:px-4"
                  >
                    <span className="text-sm font-medium">
                      {omcType.name} ({omcType.unit})
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant={alreadyAdded ? "ghost" : "default"}
                      disabled={alreadyAdded || isMutating}
                      className="shrink-0"
                      onClick={
                        () =>
                          createFuelTypeMutaion.mutate({
                            name: omcType.name,
                            unit: omcType.unit,
                            omcId: omcType.omcId,
                            isCustom: false,
                          }) // unit from OMC/backend
                      }
                    >
                      {alreadyAdded ? (
                        <>
                          <Check className="me-1 h-4 w-4" />
                          <span className="hidden sm:inline">Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="me-1 h-4 w-4" />
                          <span className="hidden sm:inline">Add</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
              {omcFuelTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No product types configured for this OMC yet.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This station&apos;s OMC could not be determined.
            </p>
          )}
        </div>

        <Separator />

        {/* Custom product type: name + unit (L/kg) */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Custom product type</h3>
            <p className="text-xs text-muted-foreground">
              Selling something not listed above? Add it here.
            </p>
          </div>
          <form
            onSubmit={handleAddCustom}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor="ft-name">Name</Label>
              <Input
                id="ft-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Diesel Premium"
                disabled={isMutating}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Unit</Label>
              <Select
                value={unit}
                onValueChange={setUnit}
                disabled={isMutating}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Liter (L)</SelectItem>
                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              variant="secondary"
              disabled={isMutating}
              className="w-full sm:w-auto"
            >
              <Plus className="me-1 h-4 w-4" />
              Add custom product
            </Button>
          </form>
          {/* [&>svg+div]:translate-y-0 fixes Shadcn Alert icon/text alignment when no AlertTitle */}
          {createFuelTypeMutaion.isError && (
            <Alert variant="destructive" className="[&>svg+div]:translate-y-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {createFuelTypeMutaion.error instanceof Error
                  ? createFuelTypeMutaion.error.message
                  : "Save failed."}
              </AlertDescription>
            </Alert>
          )}
        </div>
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
          <Button variant="outline" disabled>
            Back
          </Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
