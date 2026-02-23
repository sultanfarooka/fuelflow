import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Fuel, Shield } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login', search: { redirect: '/dashboard' } })
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
  })

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Temporary secure route to test cookie-based authentication
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Auth status
          </CardTitle>
          <CardDescription>
            If you see this page, you passed the route guard. The /auth/me call verifies the server accepts your cookie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Client: {user ? 'Logged in' : 'No user in store'}</Badge>
            {isLoading && <Badge variant="outline">Fetching /auth/me...</Badge>}
            {data && <Badge className="bg-green-600">Server: Cookie valid</Badge>}
            {error && <Badge variant="destructive">Server: {error.message}</Badge>}
          </div>

          {data?.data && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium">User from /auth/me (server):</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.data.user.fullName} ({data.data.user.email}) — {data.data.user.role}
              </p>
              {data.data.subscription && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Plan: {data.data.subscription.plan} — {data.data.subscription.status}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Quick test
          </CardTitle>
          <CardDescription>
            Log out and try visiting /dashboard — you should be redirected to login.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
