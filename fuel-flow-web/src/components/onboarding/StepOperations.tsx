import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createShiftConfig } from "@/lib/api/stations/shift-config";
import { cn } from "@/lib/utils";

interface Props {
  stationId: string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const DEFAULT_NAMES_2 = ["Morning", "Evening"];
const DEFAULT_NAMES_3 = ["Morning", "Evening", "Night"];

export function StepOperations({ stationId, onNext, onBack, onSkip }: Props) {
  const { t } = useTranslation();
  const [shiftCount, setShiftCount] = useState<2 | 3>(2);
  const [shift1Name, setShift1Name] = useState("Morning");
  const [shift1Time, setShift1Time] = useState("06:00");
  const [shift2Name, setShift2Name] = useState("Evening");
  const [shift2Time, setShift2Time] = useState("14:00");
  const [shift3Name, setShift3Name] = useState("Night");
  const [shift3Time, setShift3Time] = useState("22:00");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const shiftMutation = useMutation({
    mutationFn: () =>
      createShiftConfig(stationId, {
        shiftCount,
        shift1Name,
        shift1StartTime: shift1Time,
        shift2Name,
        shift2StartTime: shift2Time,
        shift3Name: shiftCount === 3 ? shift3Name : undefined,
        shift3StartTime: shiftCount === 3 ? shift3Time : undefined,
      }),
  });

  const handleShiftCountChange = (count: 2 | 3) => {
    setShiftCount(count);
    const names = count === 2 ? DEFAULT_NAMES_2 : DEFAULT_NAMES_3;
    setShift1Name(names[0]);
    setShift2Name(names[1]);
    if (count === 3) setShift3Name(names[2]);
  };

  const handleNext = async () => {
    if (
      !shift1Name.trim() ||
      !shift1Time ||
      !shift2Name.trim() ||
      !shift2Time ||
      (shiftCount === 3 && (!shift3Name.trim() || !shift3Time))
    ) {
      setSubmitError(t("onboarding.step6.validationError"));
      return;
    }
    setSubmitError(null);
    try {
      await shiftMutation.mutateAsync();
      onNext();
    } catch {
      setSubmitError(t("onboarding.step6.saveError"));
      toast.error(t("onboarding.step6.toastError"));
    }
  };

  const isPending = shiftMutation.isPending;

  return (
    <div className="space-y-6">
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("onboarding.step6.shiftTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Shift count toggle */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            {([2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleShiftCountChange(n)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  shiftCount === n
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n === 2
                  ? t("onboarding.step6.shifts2")
                  : t("onboarding.step6.shifts3")}
              </button>
            ))}
          </div>

          <FieldGroup>
            {/* Shift 1 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="s1-name">
                  {t("onboarding.step6.shift1Name")}
                </FieldLabel>
                <Input
                  id="s1-name"
                  //size="lg"
                  value={shift1Name}
                  onChange={(e) => setShift1Name(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="s1-time">
                  {t("onboarding.step6.startTime")}
                </FieldLabel>
                <Input
                  id="s1-time"
                  //size="lg"
                  type="time"
                  value={shift1Time}
                  onChange={(e) => setShift1Time(e.target.value)}
                />
              </Field>
            </div>

            {/* Shift 2 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="s2-name">
                  {t("onboarding.step6.shift2Name")}
                </FieldLabel>
                <Input
                  id="s2-name"
                  //size="lg"
                  value={shift2Name}
                  onChange={(e) => setShift2Name(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="s2-time">
                  {t("onboarding.step6.startTime")}
                </FieldLabel>
                <Input
                  id="s2-time"
                  //size="lg"
                  type="time"
                  value={shift2Time}
                  onChange={(e) => setShift2Time(e.target.value)}
                />
              </Field>
            </div>

            {/* Shift 3 (conditional) */}
            {shiftCount === 3 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="s3-name">
                    {t("onboarding.step6.shift3Name")}
                  </FieldLabel>
                  <Input
                    id="s3-name"
                    //size="lg"
                    value={shift3Name}
                    onChange={(e) => setShift3Name(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="s3-time">
                    {t("onboarding.step6.startTime")}
                  </FieldLabel>
                  <Input
                    id="s3-time"
                    //size="lg"
                    type="time"
                    value={shift3Time}
                    onChange={(e) => setShift3Time(e.target.value)}
                  />
                </Field>
              </div>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isPending}
        >
          {t("onboarding.actions.back")}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleNext}
          disabled={isPending}
        >
          {isPending
            ? t("onboarding.actions.saving")
            : t("onboarding.actions.continue")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onSkip}
          disabled={isPending}
        >
          {t("onboarding.actions.skip")}
        </Button>
      </div>
    </div>
  );
}
