import { createFileRoute, Link } from '@tanstack/react-router'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/auth/check-email')({
  component: CheckEmailPage,
})

function CheckEmailPage() {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="mt-3 text-muted-foreground">
        We sent you a verification link. Click it to activate your account.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}
