import { useState } from "react";
import { Building2, Fuel, MapPin, Phone, UploadCloud } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FormTextField } from "@/components/forms/form-text-field";
import {
  completeOnboarding,
  type OnboardingRequest,
} from "@/lib/api/auth";
import { getOMCs, type OMC } from "@/lib/api/omcs";
import {
  onboardingSchema,
  type OnboardingFormData,
} from "@/lib/validators/auth";
import { useAuthStore } from "@/stores/auth-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/onboarding/")({
  component: RouteComponent,
});

function RouteComponent() {
  const setAuthState = useAuthStore((s) => s.setAuthState);
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: omcResponse, isLoading: isLoadingOmcs } = useQuery({
    queryKey: ["omcs"],
    queryFn: getOMCs,
  });

  const omcs: OMC[] = omcResponse?.data ?? [];

  const onboardingMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (response) => {
      const auth = response.data;
      setAuthState(auth);
      toast.success("You're all set up! Redirecting to dashboard...");
      navigate({ to: "/dashboard" });
    },
    onError: (error: Error) => {
      const message =
        error.message ?? "Onboarding failed. Please review your details.";
      setSubmitError(message);
      toast.error(message);
    },
  });

  const form = useForm({
    defaultValues: {
      organizationName: "",
      stationName: "",
      omcId: "",
      address: "",
      phone: "",
      logoUrl: "",
    } satisfies OnboardingFormData,
    validators: {
      onSubmit: onboardingSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      const payload: OnboardingRequest = {
        organizationName: value.organizationName,
        stationName: value.stationName,
        omcId: value.omcId,
        address: value.address || undefined,
        phone: value.phone || undefined,
        logoUrl: value.logoUrl || undefined,
      };
      await onboardingMutation.mutateAsync(payload);
    },
  });

  const isSubmitting =
    form.state.isSubmitting || onboardingMutation.isPending;

  return (
    <div className="bg-linear-to-b from-primary/5 via-background to-background px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="flex flex-col justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Fuel className="size-3.5" />
              <span>Step 1 of 1 · Station setup</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Set up your first station
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                We&apos;ll create your organization and primary fuel station.
                This helps Fuel Flow personalize reports, pricing, and
                permissions for your team.
              </p>
            </div>
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Organization profile
                  </p>
                  <p className="text-xs">
                    Name and branding for invoices, dashboards, and staff
                    access.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Station details
                  </p>
                  <p className="text-xs">
                    Location, OMC, and contact so you can start tracking
                    inventory.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden flex-col gap-2 text-xs text-muted-foreground sm:flex">
            <p className="font-medium text-foreground">
              Why we need this information
            </p>
            <p>
              Your data is encrypted in transit and never shared with third
              parties. You can edit organization and station details later from
              your dashboard.
            </p>
          </div>
        </section>

        <section>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            <FieldGroup>
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold">Organization &amp; station</h2>
                <p className="text-xs text-muted-foreground">
                  You can invite staff and add more stations after onboarding.
                </p>
              </div>

              <form.Field
                name="organizationName"
                children={(field) => (
                  <FormTextField
                    field={field}
                    label="Organization name"
                    placeholder="e.g. Fuel Flow Petroleum (Pvt) Ltd"
                    autoComplete="organization"
                  />
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="stationName"
                  children={(field) => (
                    <FormTextField
                      field={field}
                      label="Primary station name"
                      placeholder="e.g. FF Johar Town"
                      autoComplete="off"
                    />
                  )}
                />

                <form.Field
                  name="omcId"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched &&
                      !field.state.meta.isValid;
                    const errorId = `${field.name}-error`;
                    const descriptionId = `${field.name}-description`;

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          OMC (Oil Marketing Company)
                        </FieldLabel>
                        <div className="relative">
                          <select
                            id={field.name}
                            name={field.name}
                            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-hidden ring-offset-background focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            aria-describedby={
                              isInvalid
                                ? errorId
                                : descriptionId
                            }
                            disabled={isLoadingOmcs || isSubmitting}
                          >
                            <option value="">
                              {isLoadingOmcs
                                ? "Loading OMCs..."
                                : "Select OMC"}
                            </option>
                            {omcs.map((omc) => (
                              <option key={omc.id} value={omc.id}>
                                {omc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <FieldDescription id={descriptionId}>
                          Choose the OMC your station is registered with.
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError id={errorId} errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="address"
                  children={(field) => (
                    <FormTextField
                      field={field}
                      label="Station address (optional)"
                      placeholder="Street, area, city"
                      autoComplete="street-address"
                    />
                  )}
                />
                <form.Field
                  name="phone"
                  children={(field) => (
                    <FormTextField
                      field={field}
                      label="Contact phone (optional)"
                      type="tel"
                      inputMode="tel"
                      placeholder="+92XXXXXXXXXX"
                      autoComplete="tel"
                      description="Pakistani format: +92XXXXXXXXXX"
                    />
                  )}
                />
              </div>

              <form.Field
                name="logoUrl"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Logo URL (optional)
                    </FieldLabel>
                    <div className="flex items-center gap-2">
                      <FormTextField
                        field={field}
                        label=""
                        placeholder="https://your-cdn.com/logo.png"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled
                        aria-label="Upload logo (coming soon)"
                      >
                        <UploadCloud className="size-4" />
                      </Button>
                    </div>
                    <FieldDescription>
                      Paste a public image URL for your organization logo.
                    </FieldDescription>
                  </Field>
                )}
              />

              {submitError && (
                <Alert variant="destructive" className="max-w-md">
                  <AlertTitle>Couldn&apos;t complete onboarding</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <Field>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting || isLoadingOmcs}
                >
                  {isSubmitting ? "Saving setup..." : "Finish setup"}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="size-3.5" />
            <span>
              Need help? Contact support and we&apos;ll onboard your stations
              for you.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
