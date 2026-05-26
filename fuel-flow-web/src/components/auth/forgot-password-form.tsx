import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormTextField } from "@/components/forms/form-text-field";
import {
  forgotPassword,
  type ForgotPasswordRequest,
  type ForgotPasswordResponse,
} from "@/lib/api/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validators/auth";

/**
 * Forgot password form per [M01-F09-R08].
 * Stage 1: enter identifier.
 *   - Server returns eligible channels (anti-enumeration: empty when unknown).
 *   - If only one channel: server auto-dispatches; we navigate.
 *   - If both: we render a chooser (stage 2).
 * Stage 2: user picks SMS or Email, we re-submit with `channel`.
 *   - On dispatched=true: navigate to the channel-specific reset screen.
 */
export function ForgotPasswordForm() {
  const navigate = useNavigate();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingIdentifier, setPendingIdentifier] = useState<string | null>(
    null,
  );
  const [channels, setChannels] = useState<ForgotPasswordResponse | null>(null);

  function dispatchNavigation(
    data: ForgotPasswordResponse,
    identifier: string,
  ) {
    if (!data.dispatched) return;
    if (data.channelUsed === "sms") {
      navigate({ to: "/auth/reset-password-otp", search: { phone: identifier } });
    } else {
      navigate({ to: "/auth/check-email-reset", search: { email: identifier } });
    }
  }

  const submitMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (res, variables) => {
      const data = res.data;
      if (data.dispatched) {
        toast.success(data.message ?? "Recovery code sent.");
        dispatchNavigation(data, variables.identifier);
        return;
      }
      if (data.eligibleChannels.length >= 2) {
        // Show the chooser. Don't toast — message is generic and may confuse.
        setChannels(data);
        setPendingIdentifier(variables.identifier);
        return;
      }
      // 0 eligible (unknown / unverified identifier) — generic success per anti-enumeration.
      toast.success(data.message ?? "If an account exists, we've sent recovery instructions.");
      navigate({ to: "/auth/login" });
    },
    onError: (err: Error) => {
      const message = err.message ?? "Request failed. Please try again.";
      setSubmitError(message);
      toast.error(message);
    },
  });

  const form = useForm({
    defaultValues: { identifier: "" } satisfies ForgotPasswordFormData,
    validators: { onSubmit: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      await submitMutation.mutateAsync(value as ForgotPasswordRequest);
    },
  });

  const handlePickChannel = async (channel: "sms" | "email") => {
    if (!pendingIdentifier) return;
    setSubmitError(null);
    const res = await submitMutation.mutateAsync({
      identifier: pendingIdentifier,
      channel,
    });
    // dispatch handled in onSuccess; this is just a safety net.
    if (!res.data.dispatched) {
      setSubmitError("Couldn't dispatch via that channel. Try the other one.");
    }
  };

  if (channels && pendingIdentifier) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Choose how to reset</h1>
          <p className="text-muted-foreground text-balance text-sm">
            Both channels are available on your account.
          </p>
        </div>
        {channels.maskedPhone && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handlePickChannel("sms")}
            disabled={submitMutation.isPending}
          >
            Send code to <strong className="ms-1">{channels.maskedPhone}</strong>
          </Button>
        )}
        {channels.maskedEmail && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handlePickChannel("email")}
            disabled={submitMutation.isPending}
          >
            Email link to <strong className="ms-1">{channels.maskedEmail}</strong>
          </Button>
        )}
        {submitError && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setChannels(null);
            setPendingIdentifier(null);
          }}
        >
          Use a different identifier
        </Button>
      </div>
    );
  }

  return (
    <form
      id="forgot-password-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-muted-foreground text-balance text-sm">
            Enter your phone number or email and we&apos;ll send a recovery
            code or link.
          </p>
        </div>
        <form.Field
          name="identifier"
          children={(field) => (
            <FormTextField
              field={field}
              label="Phone or email"
              type="text"
              placeholder="+92XXXXXXXXXX or m@example.com"
              autoComplete="username"
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
            disabled={form.state.isSubmitting || submitMutation.isPending}
          >
            {form.state.isSubmitting || submitMutation.isPending
              ? "Sending..."
              : "Continue"}
          </Button>
        </Field>
        <div className="text-center text-sm text-muted-foreground">
          <Link
            to="/auth/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
