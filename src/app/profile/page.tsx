import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/db/users";

// Protected by the proxy (matcher includes /profile), with a guard here too.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto max-w-lg p-6">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to dashboard
      </Link>

      <div className="mt-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} image={user.image} className="size-16" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">
              {user.name ?? "User"}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
            <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {user.isPro ? "Pro plan" : "Free plan"}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
