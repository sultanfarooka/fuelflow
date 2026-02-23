import { createFileRoute, Link } from '@tanstack/react-router'
import { Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/auth/check-email-reset')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: CheckEmailResetPage,
})

/**
 * Message page after submitting forgot-password — same pattern as check-email for registration.
 * Shows generic success message (no disclosure of whether email exists).
 */
function CheckEmailResetPage() {
  const { email } = Route.useSearch()

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="mt-3 text-muted-foreground">
        {email ? (
          <>
            If an account exists for <strong className="text-foreground">{email}</strong>, we&apos;ve
            sent a password reset link. Check your inbox and spam folder.
          </>
        ) : (
          <>
            If an account exists with that email, we&apos;ve sent a password reset link.
            Check your inbox and spam folder.
          </>
        )}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to="/auth/login">Back to sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Go to Home</Link>
        </Button>
      </div>
    </div>
  )
}
