import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircleIcon, CheckCircle2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormTextField } from "@/components/forms/form-text-field";
import { confirmPhoneChange, requestPhoneChange } from "@/lib/api/auth";
import {
  confirmPhoneChangeSchema,
  requestPhoneChangeSchema,
  type ConfirmPhoneChangeFormData,
  type RequestPhoneChangeFormData,
} from "@/lib/validators/auth";
import { useAuthStore } from "@/stores/auth-store";

/**
 * /dashboard/account/phone — two-step phone change ([M01-F09-R11]).
 * Step 1: user enters the new phone -> backend sends OTP to the new number.
 * Step 2: user enters OTP -> backend swaps user.PhoneNumber.
 */
export const Route = createFileRoute("/dashboard/account/phone")({
  component: ChangePhonePage,
});

type Stage = "request" | "confirm" | "done";

function ChangePhonePage() {
  const currentUser = useAuthStore((s) => s.user);

  const [stage, setStage] = useState<Stage>("request");
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requestForm = useForm({
    defaultValues: { newPhone: "" } satisfies RequestPhoneChangeFormData,
    validators: { onSubmit: requestPhoneChangeSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      await requestMutation.mutateAsync(value);
    },
  });

  const confirmForm = useForm({
    defaultValues: { code: "" } satisfies ConfirmPhoneChangeFormData,
    validators: { onSubmit: confirmPhoneChangeSchema },
    onSubmit: async ({ value }) => {
      if (!pendingPhone) {
        setSubmitError("No pending change. Submit a new phone first.");
        return;
      }
      setSubmitError(null);
      await confirmMutation.mutateAsync({
        newPhone: pendingPhone,
        code: value.code,
      });
    },
  });

  const requestMutation = useMutation({
    mutationFn: requestPhoneChange,
    onSuccess: (data, variables) => {
      toast.success(data.data?.message ?? "Verification code sent.");
      setPendingPhone(variables.newPhone);
      setStage("confirm");
    },
    onError: (err: Error) => {
      const message = err.message ?? "Could not request a phone change.";
      setSubmitError(message);
      toast.error(message);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: confirmPhoneChange,
    onSuccess: (data) => {
      toast.success(data.data?.message ?? "Phone number updated.");
      setStage("done");
    },
    onError: (err: Error) => {
      const message = err.message ?? "Could not confirm the code.";
      setSubmitError(message);
      toast.error(message);
    },
  });

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        {stage === "done" ? (
          <CheckCircle2 className="h-8 w-8" />
        ) : (
          <MessageSquare className="h-8 w-8" />
        )}
      </div>
      <h1 className="text-2xl font-bold text-center">Change phone number</h1>

      {stage === "request" && (
        <>
          <p className="mt-3 text-center text-muted-foreground">
            Enter your new phone number. We&apos;ll send a 6-digit verification
            code to the new number. Your current login will keep working until
            you confirm.
          </p>

          <form
            id="request-phone-change-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              requestForm.handleSubmit();
            }}
            className="mt-8 flex w-full flex-col gap-6"
          >
            <FieldGroup>
              <requestForm.Field
                name="newPhone"
                children={(field) => (
                  <FormTextField
                    field={field}
                    label="New phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+92XXXXXXXXXX"
                    autoComplete="tel"
                    description={
                      currentUser
                        ? `Currently logged in as ${currentUser.fullName ?? currentUser.email}.`
                        : undefined
                    }
                  />
                )}
              />
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Couldn&apos;t send code</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              <Field>
                <Button
                  type="submit"
                  disabled={
                    requestForm.state.isSubmitting || requestMutation.isPending
                  }
                >
                  {requestMutation.isPending ? "Sending..." : "Send code"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </>
      )}

      {stage === "confirm" && pendingPhone && (
        <>
          <p className="mt-3 text-center text-muted-foreground">
            We sent a 6-digit code to{" "}
            <strong className="text-foreground">{pendingPhone}</strong>. Enter
            it below to complete the change.
          </p>

          <form
            id="confirm-phone-change-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              confirmForm.handleSubmit();
            }}
            className="mt-8 flex w-full flex-col gap-6"
          >
            <FieldGroup>
              <confirmForm.Field
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
                  disabled={
                    confirmForm.state.isSubmitting || confirmMutation.isPending
                  }
                >
                  {confirmMutation.isPending
                    ? "Confirming..."
                    : "Confirm change"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStage("request");
                    setSubmitError(null);
                    setPendingPhone(null);
                  }}
                >
                  Use a different number
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </>
      )}

      {stage === "done" && (
        <>
          <p className="mt-3 text-center text-muted-foreground">
            Your phone number has been updated to{" "}
            <strong className="text-foreground">{pendingPhone}</strong>. Future
            sign-ins should use the new number.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
