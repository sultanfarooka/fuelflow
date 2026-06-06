import { useEffect, useState } from "react"
import { Building2, Fuel, MapPin, UploadCloud } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { FormTextField } from "@/components/forms/form-text-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProvisioningOverlay } from "@/components/onboarding/ProvisioningOverlay"
import { completeOnboarding, type OnboardingRequest } from "@/lib/api/auth"
import { getOMCs, type OMC } from "@/lib/api/omcs"
import { onboardingSchema, type OnboardingFormData } from "@/lib/validators/auth"
import { useAuthStore } from "@/stores/auth-store"

interface Props {
  onNext: (stationId: string, omcId: string) => void
}

export function StepOrgStation({ onNext }: Props) {
  const { t } = useTranslation()
  const setAuthState = useAuthStore((s) => s.setAuthState)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: omcResponse, isLoading: isLoadingOmcs } = useQuery({
    queryKey: ["omcs"],
    queryFn: getOMCs,
  })
  const omcs: OMC[] = omcResponse?.data ?? []

  const mutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (response) => {
      const auth = response.data
      setAuthState(auth)
      const stationId = auth.stations?.[0]?.id ?? ""
      const selectedOmcId = form.state.values.omcId
      toast.success(t("onboarding.step1.successToast"))
      onNext(stationId, selectedOmcId)
    },
    onError: (error: Error) => {
      const msg = error.message ?? "Setup failed. Please review your details."
      setSubmitError(msg)
      toast.error(msg)
    },
  })

  const form = useForm({
    defaultValues: {
      organizationName: "",
      stationName: "",
      omcId: "",
      address: "",
      phone: "",
      logoUrl: "",
    } satisfies OnboardingFormData,
    validators: { onSubmit: onboardingSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      const payload: OnboardingRequest = {
        organizationName: value.organizationName,
        stationName: value.stationName,
        omcId: value.omcId,
        address: value.address || undefined,
        phone: value.phone || undefined,
        logoUrl: value.logoUrl || undefined,
      }
      await mutation.mutateAsync(payload)
    },
  })

  const isSubmitting = form.state.isSubmitting || mutation.isPending

  useEffect(() => {
    if (!mutation.isPending) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      return ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [mutation.isPending])

  return (
    <>
      {mutation.isPending && <ProvisioningOverlay />}
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="flex flex-col justify-between gap-8">
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("onboarding.step1.heading")}
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              {t("onboarding.step1.subheading")}
            </p>
          </div>
          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("onboarding.step1.featureOrg")}</p>
                <p className="text-xs">{t("onboarding.step1.featureOrgDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                <MapPin className="size-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("onboarding.step1.featureStation")}</p>
                <p className="text-xs">{t("onboarding.step1.featureStationDesc")}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {t("onboarding.step1.footerNote")}
        </p>
      </section>

      <section>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          <FieldGroup>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">{t("onboarding.step1.formTitle")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("onboarding.step1.formDesc")}
              </p>
            </div>

            <form.Field
              name="organizationName"
              children={(field) => (
                <FormTextField
                  field={field}
                  label={t("onboarding.step1.orgName")}
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
                    label={t("onboarding.step1.stationName")}
                    placeholder="e.g. FF Johar Town"
                    autoComplete="off"
                  />
                )}
              />

              <form.Field
                name="omcId"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  const errorId = `${field.name}-error`
                  const descId = `${field.name}-desc`
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>{t("onboarding.step1.omc")}</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v)}
                        disabled={isLoadingOmcs || isSubmitting}
                      >
                        <SelectTrigger
                          id={field.name}
                          onBlur={field.handleBlur}
                          aria-invalid={isInvalid}
                          aria-describedby={isInvalid ? errorId : descId}
                          className="w-full"
                        >
                          <SelectValue
                            placeholder={isLoadingOmcs ? t("onboarding.step1.omcLoading") : t("onboarding.step1.omcPlaceholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {omcs.map((omc) => (
                            <SelectItem key={omc.id} value={omc.id}>
                              {omc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription id={descId}>
                        {t("onboarding.step1.omcDesc")}
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError id={errorId} errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field
                name="address"
                children={(field) => (
                  <FormTextField
                    field={field}
                    label={t("onboarding.step1.address")}
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
                    label={t("onboarding.step1.phone")}
                    type="tel"
                    inputMode="tel"
                    placeholder="+92XXXXXXXXXX"
                    autoComplete="tel"
                  />
                )}
              />
            </div>

            <form.Field
              name="logoUrl"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>{t("onboarding.step1.logoUrl")}</FieldLabel>
                  <div className="flex items-center gap-2">
                    <FormTextField field={field} label="" placeholder="https://…/logo.png" />
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
                  <FieldDescription>{t("onboarding.step1.logoDesc")}</FieldDescription>
                </Field>
              )}
            />

            {submitError && (
              <Alert variant="destructive">
                <Fuel className="size-4" />
                <AlertTitle>{t("onboarding.step1.errorTitle")}</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="h-10 w-full px-4 text-sm sm:w-auto" disabled={isSubmitting || isLoadingOmcs}>
              {isSubmitting ? t("onboarding.actions.creating") : t("onboarding.actions.continue")}
            </Button>
          </FieldGroup>
        </form>
      </section>
    </div>
    </>
  )
}
