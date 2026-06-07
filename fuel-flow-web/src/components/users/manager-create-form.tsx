import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FormTextField } from "@/components/forms/form-text-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { createManager, type CreateManagerPayload } from "@/lib/api/users";
import {
  createManagerSchema,
  type CreateManagerFormData,
} from "@/lib/validators/users";
import { useAuthStore } from "@/stores/auth-store";

interface ManagerCreateFormProps {
  /** Called after a successful create (e.g. to collapse the form). */
  onCreated?: () => void;
}

/**
 * Owner-only form to create a Manager ([M01-F05-R02]). Assigns one or more
 * stations, and an OTP-required toggle ([M01-F09-R07]). On the OTP-not-required
 * path the API returns a one-time temporary password, shown here once.
 */
export function ManagerCreateForm({ onCreated }: ManagerCreateFormProps) {
  const queryClient = useQueryClient();
  const { stations, organization } = useAuthStore();
  const stationList = stations ?? [];

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string>("");

  const createMutation = useMutation({
    mutationFn: createManager,
    onSuccess: (res) => {
      const data = res.data;
      toast.success(data.message ?? "Manager created.");
      queryClient.invalidateQueries({
        queryKey: ["managers", organization?.id],
      });
      if (data.temporaryPassword) {
        setCreatedName(data.fullName);
        setTempPassword(data.temporaryPassword);
      } else {
        setTempPassword(null);
      }
      form.reset();
      onCreated?.();
    },
    onError: (error: Error) => {
      const message =
        error.message ?? "Could not create the manager. Please try again.";
      setSubmitError(message);
      toast.error(message);
    },
  });

  const form = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      // Widen literals so TanStack Form infers string[]/boolean (not never[]/true).
      stationIds: [] as string[],
      requireOtp: true as boolean,
    } satisfies CreateManagerFormData,
    validators: { onSubmit: createManagerSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      const payload: CreateManagerPayload = {
        fullName: value.fullName,
        phone: value.phone,
        email: value.email && value.email.length > 0 ? value.email : undefined,
        stationIds: value.stationIds,
        requireOtp: value.requireOtp,
      };
      await createMutation.mutateAsync(payload);
    },
  });

  return (
    <form
      id="create-manager-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <form.Field
          name="fullName"
          children={(field) => (
            <FormTextField
              field={field}
              label="Full name"
              placeholder="e.g. Ahmed Khan"
              autoComplete="name"
            />
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form.Field
            name="phone"
            children={(field) => (
              <FormTextField
                field={field}
                label="Phone"
                type="tel"
                inputMode="tel"
                placeholder="+92XXXXXXXXXX"
                autoComplete="tel"
                description="Pakistani format: +92XXXXXXXXXX"
              />
            )}
          />
          <form.Field
            name="email"
            children={(field) => (
              <FormTextField
                field={field}
                label="Email (optional)"
                type="email"
                inputMode="email"
                placeholder="m@example.com"
                autoComplete="email"
                description="Optional — adds a fallback login channel."
              />
            )}
          />
        </div>

        <form.Field
          name="stationIds"
          children={(field) => {
            const selected = field.state.value;
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>Stations</FieldLabel>
                <FieldDescription>
                  Assign at least one station this manager can access.
                </FieldDescription>
                <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                  {stationList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No stations available yet.
                    </p>
                  ) : (
                    stationList.map((s) => {
                      const checked = selected.includes(s.id);
                      const id = `station-${s.id}`;
                      return (
                        <div key={s.id} className="flex items-center gap-2">
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={(c) => {
                              const next =
                                c === true
                                  ? [...selected, s.id]
                                  : selected.filter((sid) => sid !== s.id);
                              field.handleChange(next);
                            }}
                          />
                          <FieldLabel htmlFor={id} className="font-normal">
                            {s.name}
                          </FieldLabel>
                        </div>
                      );
                    })
                  )}
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        <form.Field
          name="requireOtp"
          children={(field) => (
            <Field orientation="horizontal">
              <Checkbox
                id="require-otp"
                checked={field.state.value}
                onCheckedChange={(c) => field.handleChange(c === true)}
              />
              <FieldLabel htmlFor="require-otp" className="font-normal">
                Require phone verification (SMS code) before first login
              </FieldLabel>
            </Field>
          )}
        />

        <form.Subscribe
          selector={(s) => s.values.requireOtp}
          children={(requireOtp) =>
            !requireOtp ? (
              <Alert>
                <AlertCircleIcon />
                <AlertTitle>Temporary password</AlertTitle>
                <AlertDescription>
                  No SMS code will be sent. A one-time temporary password will
                  be shown once after creation — share it with the manager so
                  they can sign in and change it.
                </AlertDescription>
              </Alert>
            ) : null
          }
        />

        {submitError && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Could not create manager</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {tempPassword && (
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Manager created — temporary password</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>
                Share this one-time password with{" "}
                <strong className="text-foreground">{createdName}</strong>. It
                won&apos;t be shown again.
              </span>
              <span className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                  {tempPassword}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(tempPassword);
                    toast.success("Temporary password copied.");
                  }}
                >
                  <Copy className="size-3.5" />
                  Copy
                </Button>
              </span>
            </AlertDescription>
          </Alert>
        )}

        <Field orientation="horizontal" className="justify-end">
          <Button
            type="submit"
            disabled={form.state.isSubmitting || createMutation.isPending}
          >
            {form.state.isSubmitting || createMutation.isPending
              ? "Creating..."
              : "Create manager"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
