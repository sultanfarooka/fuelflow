import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircleIcon, KeyRound, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FormTextField } from "@/components/forms/form-text-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { activateAccount, resendOtp } from "@/lib/api/auth";
import {
  activateAccountSchema,
  type ActivateAccountFormData,
} from "@/lib/validators/users";

/**
 * /auth/activate — one-step activation for an invited Manager ([M01-F05-R02], [M01-F09-R07]):
 * enter the SMS code and choose a password. Verifies the OTP and sets the first
 * password together. Reuses /auth/resend-otp for re-sending the code.
 */
export const Route = createFileRoute("/auth/activate")({
  validateSearch: (search: Record<string, unknown>) => ({
    phone: typeof search.phone === "string" ? search.phone : undefined,
  }),
  component: ActivateAccountPage,
});

const RESEND_COOLDOWN_SECONDS = 60;

function ActivateAccountPage() {
  const { phone } = Route.useSearch();
  const navigate = useNavigate();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const activateMutation = useMutation({
    mutationFn: activateAccount,
    onSuccess: (res) => {
      toast.success(
        res.data?.message ?? "Your account is active — you can sign in now.",
      );
      navigate({ to: "/auth/login" });
    },
    onError: (err: Error) => {
      const message =
        err.message ?? "Could not activate your account. Please try again.";
      setSubmitError(message);
      toast.error(message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendOtp,
    onSuccess: (data) => {
      toast.success(data.data?.message ?? "A new code has been sent.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not resend the code.");
    },
  });

  const form = useForm({
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    } satisfies ActivateAccountFormData,
    validators: { onSubmit: activateAccountSchema },
    onSubmit: async ({ value }) => {
      if (!phone) {
        setSubmitError(
          "This page is missing your phone number. Use the link from your invite SMS.",
        );
        return;
      }
      setSubmitError(null);
      await activateMutation.mutateAsync({
        phone,
        code: value.code,
        newPassword: value.newPassword,
      });
    },
  });

  if (!phone) {
    return (
      <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Missing phone number</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn&apos;t tell which account to activate. Open the link from
          your invite SMS, or ask your owner to re-send it.
        </p>
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link to="/auth/login">I already have an account</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <KeyRound className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-center">Activate your account</h1>
      <p className="mt-3 text-center text-muted-foreground">
        Enter the 6-digit code sent to{" "}
        <strong className="text-foreground">{phone}</strong> and choose a
        password to finish setting up your account.
      </p>

      <form
        id="activate-account-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="mt-8 flex w-full flex-col gap-6"
      >
        <FieldGroup>
          <form.Field
            name="code"
            children={(field) => (
              <FormTextField
                field={field}
                label="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                description="6 digits from the SMS invite."
              />
            )}
          />
          <form.Field
            name="newPassword"
            children={(field) => (
              <FormTextField
                field={field}
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                description="Min 6 characters, at least one number."
              />
            )}
          />
          <form.Field
            name="confirmPassword"
            children={(field) => (
              <FormTextField
                field={field}
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            )}
          />

          {submitError && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Activation failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Field>
            <Button
              type="submit"
              disabled={form.state.isSubmitting || activateMutation.isPending}
            >
              {activateMutation.isPending
                ? "Activating..."
                : "Activate account"}
            </Button>
          </Field>

          <Field>
            <Button
              type="button"
              variant="outline"
              onClick={() => resendMutation.mutate({ phone })}
              disabled={resendMutation.isPending || cooldown > 0}
            >
              {resendMutation.isPending
                ? "Sending..."
                : cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend code"}
            </Button>
            <FieldDescription className="px-2 text-center">
              Already activated?{" "}
              <Link
                to="/auth/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
