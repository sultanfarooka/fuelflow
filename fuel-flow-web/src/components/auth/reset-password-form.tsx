import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormTextField } from "@/components/forms/form-text-field";
import { resetPassword, type ResetPasswordRequest } from "@/lib/api/auth";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validators/auth";

/**
 * Reset password form — new password + confirm.
 * userId and token come from the reset link (route search params).
 * On success, redirects to reset-password-success then user can sign in.
 */
export function ResetPasswordForm({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) {
  const navigate = useNavigate();

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success("Password reset successful. You can sign in now.");
      navigate({ to: "/auth/reset-password-success" });
    },
    onError: (error: Error) => {
      toast.error(
        error.message ?? "Reset failed. The link may be invalid or expired.",
      );
    },
  });

  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    } satisfies ResetPasswordFormData,
    validators: {
      onBlur: resetPasswordSchema,
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      const payload: ResetPasswordRequest = {
        userId,
        token,
        newPassword: value.newPassword,
      };
      await resetMutation.mutateAsync(payload);
    },
  });

  return (
    <form
      id="reset-password-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Set new password</h1>
          <p className="text-muted-foreground text-balance text-sm">
            Enter your new password below. It must be at least 6 characters and
            include a number.
          </p>
        </div>
        <form.Field
          name="newPassword"
          children={(field) => (
            <FormTextField
              field={field}
              label="New password"
              type="password"
              placeholder=""
              autoComplete="new-password"
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
        <Field>
          <Button
            type="submit"
            disabled={form.state.isSubmitting || resetMutation.isPending}
          >
            {form.state.isSubmitting || resetMutation.isPending
              ? "Resetting..."
              : "Reset password"}
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
