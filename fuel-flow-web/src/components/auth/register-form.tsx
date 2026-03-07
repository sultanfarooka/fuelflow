import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircleIcon, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import { GoogleIcon } from "@/components/ui/icons/google-icon";
import { FormTextField } from "@/components/forms/form-text-field";
import { register, type RegisterRequest } from "@/lib/api/auth";
import { registerSchema, type RegisterFormData } from "@/lib/validators/auth";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

/**
 * Registration form — signup-02 design.
 * Used inside auth pages with two-column layout.
 */
export function RegisterForm() {
  const navigate = useNavigate();

  const [registerMutationError, setRegisterMutationError] = useState<
    string | null
  >(null);

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (data, variables) => {
      toast.success(
        data.data?.message ??
          "Account created. Please check your email to verify.",
      );
      navigate({
        to: "/auth/check-email-register",
        search: { email: variables.email, fromRegistration: true },
      });
    },
    onError: (error: Error) => {
      const message = error.message ?? "Registration failed. Please try again.";
      setRegisterMutationError(message);
      toast.error(message);
    },
  });

  const form = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    } satisfies RegisterFormData,
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      // Clear any previous submit error when user tries again
      setRegisterMutationError(null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- confirmPassword is UI-only, not sent to API
      const { confirmPassword, ...apiPayload } = value;
      await registerMutation.mutateAsync(apiPayload as RegisterRequest);
    },
  });

  return (
    <form
      id="register-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-balance text-sm">
            Fill in the form below to create your account
          </p>
        </div>
        <form.Field
          name="fullName"
          children={(field) => (
            <FormTextField
              field={field}
              label="Full Name"
              placeholder="John Doe"
              autoComplete="name"
            />
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form.Field
            name="email"
            children={(field) => (
              <FormTextField
                field={field}
                label="Email"
                type="email"
                inputMode="email"
                placeholder="m@example.com"
                autoComplete="email"
                description="We'll use this to contact you."
              />
            )}
          />
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
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <form.Field
            name="password"
            children={(field) => (
              <FormTextField
                field={field}
                label="Password"
                type="password"
                placeholder="••••••••"
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
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                description="Please confirm your password."
              />
            )}
          />
        </div>
        {registerMutationError && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircleIcon />
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{registerMutationError}</AlertDescription>
          </Alert>
        )}
        <Field>
          <Button
            type="submit"
            disabled={form.state.isSubmitting || registerMutation.isPending}
          >
            {form.state.isSubmitting || registerMutation.isPending
              ? "Creating..."
              : "Create Account"}
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
            Sign up with Google (coming soon)
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            className="mt-2 w-full justify-center"
          >
            <Smartphone className="mr-2 size-4 shrink-0" />
            Phone signup (coming soon)
          </Button>
          <FieldDescription className="px-6 text-center">
            Already have an account?{" "}
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
  );
}
