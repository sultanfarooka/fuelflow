/**
 * Station setup wizard: one route, steps 1–4.
 * Data is persisted when the user adds or saves an item; Next only advances the step.
 * Flow: Step 1 product types → Step 2 prices → Step 3 tanks → Step 4 nozzles → Step 5 summary → Finish.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Step1FuelTypes } from "@/components/station-setup/step1-fuel-types";
import { Step2Prices } from "@/components/station-setup/step2-prices";
import { Step3Tanks } from "@/components/station-setup/step3-tanks";
import { Step4Nozzles } from "@/components/station-setup/step4-nozzles";
import { useAuthStore } from "@/stores/auth-store";

const STEPS = [
  { title: "Product types", description: "OMC types and custom types" },
  { title: "Prices", description: "Set price per product type" },
  { title: "Tanks", description: "Add fuel tanks" },
  { title: "Nozzles", description: "Map nozzles to tanks" },
] as const;

export const Route = createFileRoute("/dashboard/station/$stationId/setup")({
  component: StationSetupPage,
});

function StationSetupPage() {
  const { stationId } = Route.useParams();
  const navigate = useNavigate();
  const { stations } = useAuthStore();
  const station = stations?.find((s) => s.id === stationId);

  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleFinish = () => {
    navigate({ to: "/dashboard/station/$stationId", params: { stationId } });
  };

  if (!station) return null;

  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <Link
          to="/dashboard/station/$stationId"
          params={{ stationId }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to station
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Set up {station.name}</h1>
        <p className="text-muted-foreground">
          Step {currentStep} of 4: {STEPS[currentStep - 1].title}
        </p>
      </div>

      {/* Step progress */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i + 1 <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Active step content */}
      {currentStep === 1 && (
        <Step1FuelTypes stationId={stationId} onNext={handleNext} />
      )}
      {currentStep === 2 && (
        <Step2Prices stationId={stationId} onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 3 && (
        <Step3Tanks stationId={stationId} onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 4 && (
        <Step4Nozzles stationId={stationId} onFinish={handleFinish} onBack={handleBack} />
      )}
    </div>
  );
}
