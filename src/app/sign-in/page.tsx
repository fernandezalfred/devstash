import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/SignInForm";
import { Navbar } from "@/components/homepage/Navbar";
import { getCurrentUser } from "@/lib/db/users";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const destination = safeCallbackUrl(callbackUrl);

  // Already signed in — skip the form. Use the DB-backed lookup (not just the
  // JWT) so a stale session for a deleted user doesn't bounce back to a guarded
  // page and cause a redirect loop.
  const user = await getCurrentUser();
  if (user) redirect(destination);

  return (
    <>
      <Navbar signedIn={false} ctaHref="/register" />
      <main className="flex min-h-screen items-center justify-center p-4 pt-14">
        <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          <SignInForm callbackUrl={destination} />
        </div>
      </main>
    </>
  );
}
