import { useForm } from '@tanstack/react-form'
import { Github, Smartphone } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { loginSchema } from '@/lib/validators/auth'

/**
 * Login form — signup-02 design (matching register).
 * Used inside auth pages with two-column layout.
 */
export function LoginForm() {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onBlur: loginSchema,
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      console.log('Login submitted:', value)
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
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  inputMode="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="m@example.com"
                  autoComplete="email"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )
          }}
        />
        <form.Field
          name="password"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )
          }}
        />
        <Field>
          <Button type="submit">Sign in</Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button type="button" variant="outline" disabled className="w-full justify-center">
            <Github className="mr-2 size-4 shrink-0" />
            Sign in with GitHub (coming soon)
          </Button>
          <Button type="button" variant="outline" disabled className="mt-2 w-full justify-center">
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
