import { createFileRoute, Link } from '@tanstack/react-router'
import { Fuel } from 'lucide-react'

import { RegisterForm } from '@/components/auth/register-form'

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

/**
 * Registration page — signup-02 layout.
 * Two columns: form on left, visual panel on right (lg+).
 */
function RegisterPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-x-hidden p-6 md:p-10">
        <div className="flex shrink-0 justify-center gap-2 md:justify-start">
          <Link to="/" className="flex items-center gap-2 font-medium text-foreground hover:text-foreground/80">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Fuel className="size-4" />
            </div>
            Fuel Flow
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center py-4">
            <div className="w-full max-w-md">
              <RegisterForm />
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
            <h2 className="text-xl font-semibold">Start your free trial</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Join filling station owners across Pakistan. 14-day trial with full
              Professional features — no credit card required.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span>• Multi-station support</span>
            <span>• Shift & inventory</span>
            <span>• Credit management</span>
          </div>
        </div>
      </div>
    </div>
  )
}
