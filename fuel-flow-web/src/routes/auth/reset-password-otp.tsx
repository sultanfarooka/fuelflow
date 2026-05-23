import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircleIcon, MessageSquare, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormTextField } from "@/components/forms/form-text-field";
import { resetPasswordWithOtp } from "@/lib/api/auth";
import {
  resetPasswordOtpSchema,
  type ResetPasswordOtpFormData,
} from "@/lib/validators/auth";

/**
 * /auth/reset-password-otp — completes password reset via SMS OTP.
 * See [M01-F09-R08] and [M01-F04-R04].
 */
export const Route = createFileRoute("/auth/reset-password-otp")({
  validateSearch: (search: Record<string, unknown>) => ({
    phone: typeof search.phone === "string" ? search.phone : undefined,
  }),
  component: ResetPasswordOtpPage,
});

function ResetPasswordOtpPage() {
  const { phone } = Route.useSearch();
  const navigate = useNavigate();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: resetPasswordWithOtp,
    onSuccess: (data) => {
      toast.success(data.data?.message ?? "Password updated. You can sign in now.");
      navigate({ to: "/auth/reset-password-success" });
    },
    onError: (err: Error) => {
      const message = err.message ?? "Could not reset password.";
      setSubmitError(message);
      toast.error(message);
    },
  });

  const form = useForm({
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    } satisfies ResetPasswordOtpFormData,
    validators: { onSubmit: resetPasswordOtpSchema },
    onSubmit: async ({ value }) => {
      if (!phone) {
        setSubmitError("Missing phone number. Start over from forgot-password.");
        return;
      }
      setSubmitError(null);
      await mutation.mutateAsync({
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
          We couldn&apos;t tell which phone to reset. Start over from
          forgot-password.
        </p>
        <Button asChild className="mt-8">
          <Link to="/auth/forgot-password">Back to forgot password</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageSquare className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-center">Set a new password</h1>
      <p className="mt-3 text-center text-muted-foreground">
        Enter the code we sent to{" "}
        <strong className="text-foreground">{phone}</strong> and your new
        password.
      </p>

      <form
        id="reset-password-otp-form"
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
              />
            )}
          />
          <form.Field
            name="newPassword"
            children={(field) => (
              <FormTextField
                field={field}
                label="New password"
                type="password"
                autoComplete="new-password"
                description="Min 6 chars, at least one number."
              />
            )}
          />
          <form.Field
            name="confirmPassword"
            children={(field) => (
              <FormTextField
                field={field}
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
              />
            )}
          />
          {submitError && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Reset failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          <Field>
            <Button
              type="submit"
              disabled={form.state.isSubmitting || mutation.isPending}
            >
              {mutation.isPending ? "Updating..." : "Set new password"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
