import { createFileRoute, Link } from '@tanstack/react-router'
import { Fuel, XCircle } from 'lucide-react'

import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    userId: typeof search.userId === 'string' ? search.userId : undefined,
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordPage,
})

/**
 * Reset password page — user lands here from the email reset link.
 * URL must include ?userId=...&token=... Otherwise show invalid link message.
 */
function ResetPasswordPage() {
  const { userId, token } = Route.useSearch()
  const hasValidParams = Boolean(userId && token)

  if (!hasValidParams) {
    return (
      <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Invalid or expired link</h1>
        <p className="mt-3 text-muted-foreground">
          This password reset link is missing parameters or has expired. Please
          request a new reset link from the sign-in page.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/auth/forgot-password">Request new link</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth/login">Sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-x-hidden p-6 md:p-10">
        <div className="flex shrink-0 justify-center gap-2 md:justify-start">
          <Link
            to="/"
            className="flex items-center gap-2 font-medium text-foreground hover:text-foreground/80"
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Fuel className="size-4" />
            </div>
            Fuel Flow
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center py-4">
            <div className="w-full max-w-xs">
              <ResetPasswordForm userId={userId!} token={token!} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
          <div className="bg-primary/10 flex size-20 items-center justify-center rounded-2xl">
            <Fuel className="size-10 text-primary" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold">Fuel Flow</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Track fuel sales, manage shifts, and grow your filling station
              business — all in one place.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span>• Shift management</span>
            <span>• Credit customers</span>
            <span>• Real-time reports</span>
          </div>
        </div>
      </div>
    </div>
  )
}
