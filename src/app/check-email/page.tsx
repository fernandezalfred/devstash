import Link from "next/link";
import { MailCheck } from "lucide-react";

import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <Link href="/" className="text-lg font-semibold">
          DevStash
        </Link>

        <MailCheck className="mx-auto size-10 text-emerald-500" />

        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to{" "}
            {email ? (
              <span className="font-medium text-foreground">{email}</span>
            ) : (
              "your email address"
            )}
            . Click the link to verify your account — it expires in 24 hours.
          </p>
        </div>

        {email && <ResendVerificationForm email={email} />}

        <p className="text-sm text-muted-foreground">
          Already verified?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
