import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/verification";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";

// Tokens are consumed against the DB per-request.
export const dynamic = "force-dynamic";

type Outcome = "ok" | "expired" | "invalid";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let outcome: Outcome = "invalid";
  if (token) {
    const result = await consumeVerificationToken(token);
    if (result.status === "ok") {
      await prisma.user.updateMany({
        where: { email: result.email },
        data: { emailVerified: new Date() },
      });
      outcome = "ok";
    } else {
      outcome = result.status;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <Link href="/" className="text-lg font-semibold">
          DevStash
        </Link>

        {outcome === "ok" ? (
          <>
            <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">Email verified</h1>
              <p className="text-sm text-muted-foreground">
                Your email address has been confirmed. You&apos;re all set.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Continue to sign in
            </Link>
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-10 text-destructive" />
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">
                {outcome === "expired"
                  ? "Link expired"
                  : "Invalid verification link"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {outcome === "expired"
                  ? "This verification link has expired. Request a new one below."
                  : "This link is invalid or has already been used. Request a new one below."}
              </p>
            </div>
            <ResendVerificationForm />
          </>
        )}
      </div>
    </main>
  );
}
