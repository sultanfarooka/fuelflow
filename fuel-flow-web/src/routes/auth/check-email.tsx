import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resendVerification } from "@/lib/api/auth";

export const Route = createFileRoute("/auth/check-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const { email } = Route.useSearch();

  const resendVerificationEmailMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: () => {
      toast.success("Verification email sent. Please check your inbox.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to resend verification email.");
    },
  });

  const handleResend = () => {
    if (!email) {
      toast.error("No email address available to resend verification.");
      return;
    }
    resendVerificationEmailMutation.mutate({ email });
  };

  return (
    <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="mt-3 text-muted-foreground">
        {email ? (
          <>
            We sent a verification link to{" "}
            <strong className="text-foreground">{email}</strong>. Click it to
            activate your account.
          </>
        ) : (
          "We sent you a verification link. Click it to activate your account."
        )}
      </p>
      <div className="mt-8 flex flex-col gap-3">
        {email && (
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resendVerificationEmailMutation.isPending}
          >
            {resendVerificationEmailMutation.isPending
              ? "Sending..."
              : "Resend verification email"}
          </Button>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/">Go to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
