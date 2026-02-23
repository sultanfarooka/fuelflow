import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/auth/reset-password-success')({
  component: ResetPasswordSuccessPage,
})

/**
 * Message page after successful password reset — same pattern as check-email-register / check-email-reset.
 */
function ResetPasswordSuccessPage() {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold">Password reset successful</h1>
      <p className="mt-3 text-muted-foreground">
        Your password has been updated. You can now sign in with your new
        password.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to="/auth/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Go to Home</Link>
        </Button>
      </div>
    </div>
  )
}
