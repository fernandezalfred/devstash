import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { Navbar } from "@/components/homepage/Navbar";
import { getCurrentUser } from "@/lib/db/users";

export default async function RegisterPage() {
  // Already signed in — no need to register. DB-backed (not just the JWT) so a
  // stale session for a deleted user doesn't trigger a redirect loop.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <Navbar signedIn={false} ctaHref="/register" />
      <main className="flex min-h-screen items-center justify-center p-4 pt-14">
        <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold">Create your account</h1>
            <p className="text-sm text-muted-foreground">
              Start stashing your dev knowledge
            </p>
          </div>

          <RegisterForm />
        </div>
      </main>
    </>
  );
}
