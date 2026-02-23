import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup } from '@/components/ui/field'
import { FormTextField } from '@/components/forms/form-text-field'
import { forgotPassword, type ForgotPasswordRequest } from '@/lib/api/auth'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validators/auth'

/**
 * Forgot password form — single email field.
 * On success, redirects to check-email-reset message page (same pattern as registration → check-email).
 */
export function ForgotPasswordForm() {
  const navigate = useNavigate()

  const forgotMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (_data, variables) => {
      toast.success('If an account exists with that email, we\'ve sent a reset link.')
      navigate({ to: '/auth/check-email-reset', search: { email: variables.email } })
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Request failed. Please try again.')
    },
  })

  const form = useForm({
    defaultValues: {
      email: '',
    } satisfies ForgotPasswordFormData,
    validators: {
      onBlur: forgotPasswordSchema,
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      await forgotMutation.mutateAsync(value as ForgotPasswordRequest)
    },
  })

  return (
    <form
      id="forgot-password-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-muted-foreground text-balance text-sm">
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>
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
            />
          )}
        />
        <Field>
          <Button
            type="submit"
            disabled={form.state.isSubmitting || forgotMutation.isPending}
          >
            {form.state.isSubmitting || forgotMutation.isPending
              ? 'Sending...'
              : 'Send reset link'}
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
  )
}
