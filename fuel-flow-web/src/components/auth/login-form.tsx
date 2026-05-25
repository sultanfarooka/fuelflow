import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircleIcon, Smartphone } from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import { FormTextField } from "@/components/forms/form-text-field";
import { GoogleIcon } from "@/components/ui/icons/google-icon";
import {
  login,
  type LoginApiResponse,
  type LoginRequest,
} from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { loginSchema, type LoginFormData } from "@/lib/validators/auth";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const PHONE_VERIFICATION_PREFIX = "phone_verification_required";
const phoneRegex = /^\+92\d{10}$/;

/**
 * Login form — accepts phone or email per [M01-F09-R05].
 * On "phone_verification_required" the user is offered a direct link to
 * /auth/verify-phone with their phone pre-filled.
 */
export function LoginForm() {
  const setAuthState = useAuthStore((s) => s.setAuthState);
  const navigate = useNavigate();

  const [loginMutationError, setLoginMutationError] = useState<string | null>(
    null,
  );
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState<
    string | null
  >(null);

  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    } satisfies LoginFormData,
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setLoginMutationError(null);
      setNeedsPhoneVerification(null);
      await loginMutation.mutateAsync(value as LoginRequest);
    },
  });

  const loginMutation = useMutation<
    LoginApiResponse,
    AxiosError<{ error?: string; message?: string }>,
    LoginRequest
  >({
    mutationFn: login,
    onSuccess: (data) => {
      const auth = data.data;
      if (auth) {
        setAuthState(auth);
        if (auth.organization) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/onboarding" });
        }
      }
      toast.success(`Welcome back, ${auth?.user?.fullName ?? "User"}!`);
    },
    onError: (error, variables) => {
      const apiMessage =
        error.response?.data?.error ?? error.response?.data?.message;
      if (apiMessage?.startsWith(PHONE_VERIFICATION_PREFIX)) {
        const friendly = apiMessage.slice(PHONE_VERIFICATION_PREFIX.length).replace(/^:\s*/, "");
        setLoginMutationError(friendly || "Please verify your phone before signing in.");
        // Only offer the resend link when the identifier actually looks like a phone we can pass through.
        const pendingPhone = phoneRegex.test(variables.identifier)
          ? variables.identifier
          : null;
        setNeedsPhoneVerification(pendingPhone);
        return;
      }
      setLoginMutationError(apiMessage ?? "Login failed. Please try again.");
    },
  });

  return (
    <form
      id="login-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground text-balance text-sm">
            Enter your credentials to access your account
          </p>
        </div>
        <form.Field
          name="identifier"
          children={(field) => (
            <FormTextField
              field={field}
              label="Phone or email"
              type="text"
              inputMode="text"
              placeholder="+92XXXXXXXXXX or m@example.com"
              autoComplete="username"
              description="Use your +92 phone number, or a verified email address."
            />
          )}
        />
        <form.Field
          name="password"
          children={(field) => (
            <div className="space-y-2">
              <FormTextField
                field={field}
                label="Password"
                type="password"
                placeholder=""
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          )}
        />
        {loginMutationError && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircleIcon />
            <AlertTitle>Login failed</AlertTitle>
            <AlertDescription>
              {loginMutationError}
              {needsPhoneVerification && (
                <div className="mt-2">
                  <Link
                    to="/auth/verify-phone"
                    search={{ phone: needsPhoneVerification }}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Resend verification code
                  </Link>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        <Field>
          <Button
            type="submit"
            disabled={form.state.isSubmitting || loginMutation.isPending}
          >
            {form.state.isSubmitting || loginMutation.isPending
              ? "Signing in..."
              : "Sign in"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button
            type="button"
            variant="outline"
            disabled
            className="w-full justify-center"
          >
            <GoogleIcon className="mr-2 size-4 shrink-0" />
            Sign in with Google (coming soon)
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            className="mt-2 w-full justify-center"
          >
            <Smartphone className="mr-2 size-4 shrink-0" />
            Phone login (coming soon)
          </Button>
          <FieldDescription className="px-6 text-center">
            Don&apos;t have an account?{" "}
            <Link
              to="/auth/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
