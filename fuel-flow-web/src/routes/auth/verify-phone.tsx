import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircleIcon, MessageSquare, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { FormTextField } from "@/components/forms/form-text-field";
import { resendOtp, verifyPhone } from "@/lib/api/auth";
import {
  verifyPhoneSchema,
  type VerifyPhoneFormData,
} from "@/lib/validators/auth";

/**
 * /auth/verify-phone — phone OTP entry after signup.
 * See [M01-F09-R03], [R04], AC1/AC4/AC8.
 */
export const Route = createFileRoute("/auth/verify-phone")({
  validateSearch: (search: Record<string, unknown>) => ({
    phone: typeof search.phone === "string" ? search.phone : undefined,
  }),
  component: VerifyPhonePage,
});

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyPhonePage() {
  const { phone } = Route.useSearch();
  const navigate = useNavigate();

  const [submitError, setSubmitError] = useState<string | null>(null);
  // Initial countdown matches backend cooldown so the first resend tap is rate-aware.
  const [cooldown, setCooldown] = useState<number>(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const verifyMutation = useMutation({
    mutationFn: verifyPhone,
    onSuccess: () => {
      toast.success("Phone verified — you can sign in now.");
      navigate({ to: "/auth/login" });
    },
    onError: (err: Error) => {
      const message =
        err.message ?? "Could not verify the code. Please try again.";
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
    defaultValues: { code: "" } satisfies VerifyPhoneFormData,
    validators: { onSubmit: verifyPhoneSchema },
    onSubmit: async ({ value }) => {
      if (!phone) {
        setSubmitError("This page is missing your phone number. Start over from registration.");
        return;
      }
      setSubmitError(null);
      await verifyMutation.mutateAsync({ phone, code: value.code });
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
          We couldn't tell which phone to verify. Please start over from the
          registration page.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/auth/register">Back to registration</Link>
          </Button>
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
        <MessageSquare className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-center">Verify your phone</h1>
      <p className="mt-3 text-center text-muted-foreground">
        We sent a 6-digit code to{" "}
        <strong className="text-foreground">{phone}</strong>. Enter it below to
        activate your account.
      </p>

      <form
        id="verify-phone-form"
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
                description="6 digits from the SMS we just sent."
              />
            )}
          />

          {submitError && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Verification failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Field>
            <Button
              type="submit"
              disabled={form.state.isSubmitting || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify phone"}
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
              Wrong number?{" "}
              <Link
                to="/auth/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Start over
              </Link>
              {" · "}
              Already verified?{" "}
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
