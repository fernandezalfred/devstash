import Link from "next/link";
import { XCircle } from "lucide-react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <Link href="/" className="text-lg font-semibold">
          DevStash
        </Link>

        {token ? (
          <>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Choose a new password for your account.
              </p>
            </div>
            {/* Token validity (expired/used) is checked when the form submits,
                so a single-use token isn't burned just by opening this page. */}
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-10 text-destructive" />
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">Invalid reset link</h1>
              <p className="text-sm text-muted-foreground">
                This password reset link is missing or invalid. Request a new one
                below.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Request a new link
            </Link>
          </>
        )}

        <p className="text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
