import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/db/users";

export default async function RegisterPage() {
  // Already signed in — no need to register. DB-backed (not just the JWT) so a
  // stale session for a deleted user doesn't trigger a redirect loop.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <Link href="/" className="text-lg font-semibold">
            DevStash
          </Link>
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Start stashing your dev knowledge
          </p>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}
