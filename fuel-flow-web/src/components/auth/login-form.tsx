import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from '@/components/ui/field'
import { FormTextField } from '@/components/forms/form-text-field'
import { GoogleIcon } from '@/components/ui/icons/google-icon'
import { login, type LoginRequest } from '@/lib/api/auth'
import { loginSchema, type LoginFormData } from '@/lib/validators/auth'

/**
 * Login form — signup-02 design (matching register).
 * Used inside auth pages with two-column layout.
 */
export function LoginForm() {
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const auth = data.data
      if (auth?.accessToken) {
        localStorage.setItem('auth_token', auth.accessToken)
      }
      if (auth?.refreshToken) {
        localStorage.setItem('refresh_token', auth.refreshToken)
      }
      toast.success(`Welcome back, ${auth?.user?.fullName ?? 'User'}!`)
      navigate({ to: '/' })
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Login failed. Please try again.')
    },
  })

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } satisfies LoginFormData,
    validators: {
      onBlur: loginSchema,
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value as LoginRequest)
    },
  })

  return (
    <form
      id="login-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
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
        <form.Field
          name="password"
          children={(field) => (
            <FormTextField
              field={field}
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          )}
        />
        <Field>
          <Button
            type="submit"
            disabled={form.state.isSubmitting || loginMutation.isPending}
          >
            {form.state.isSubmitting || loginMutation.isPending
              ? 'Signing in...'
              : 'Sign in'}
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
            Don&apos;t have an account?{' '}
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
  )
}
