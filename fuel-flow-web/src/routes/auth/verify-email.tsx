import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/lib/api/auth";

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
    userId: typeof search.userId === "string" ? search.userId : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token, userId } = Route.useSearch();

  const verifyMutation = useMutation({
    mutationFn: () => verifyEmail({ token: token!, userId: userId! }),
  });

  useEffect(() => {
    if (token && userId) {
      verifyMutation.mutate();
    }
    // verifyMutation is stable for the lifetime of the route; firing once per token+userId is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  const hasParams = Boolean(token && userId);
  const isVerifying = hasParams && verifyMutation.isPending;
  const isError = verifyMutation.isError;
  const isSuccess = verifyMutation.isSuccess;

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      {/* While verifying the email */}
      {isVerifying && (
        <>
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold">Verifying your email</h1>
          <p className="mt-3 text-muted-foreground">
            Please wait while we confirm your email address...
          </p>
        </>
      )}

      {/* When the email is verified */}
      {isSuccess && (
        <>
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Email verified</h1>
          <p className="mt-3 text-muted-foreground">
            Your account is now active. You can sign in to your account.
          </p>
          <div className="mt-8 flex flex-row flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/auth/login">Go to sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Go to Home</Link>
            </Button>
          </div>
        </>
      )}

      {/* When the verification fails */}
      {isError && (
        <>
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Verification failed</h1>
          <p className="mt-3 text-muted-foreground">
            The verification link may be invalid or expired. You can request a
            new verification email from the sign-in page.
          </p>
          <div className="mt-8 flex flex-row flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/auth/login">Go to sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Go to Home</Link>
            </Button>
          </div>
        </>
      )}

      {/* When the link is invalid */}
      {!hasParams && !isVerifying && !isError && !isSuccess && (
        <>
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Invalid link</h1>
          <p className="mt-3 text-muted-foreground">
            This verification link is missing required parameters. Please use
            the link from your verification email, or request a new one.
          </p>
          <div className="mt-8 flex flex-row flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/auth/login">Go to sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Go to Home</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
