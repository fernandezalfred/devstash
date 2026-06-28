import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { getProfileUser } from "@/lib/db/users";
import { getProfileStats } from "@/lib/db/profile";
import { itemTypeIcons } from "@/lib/item-icons";

// Protected by the proxy (matcher includes /profile), with a guard here too.
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function ProfilePage() {
  const user = await getProfileUser();
  if (!user) redirect("/sign-in");

  const stats = await getProfileStats(user.id);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to dashboard
      </Link>

      {/* User info */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} image={user.image} className="size-16" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">
              {user.name ?? "User"}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {user.isPro ? "Pro plan" : "Free plan"}
              </span>
              <span className="text-xs text-muted-foreground">
                Member since {dateFormatter.format(user.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Usage stats */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Usage
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-2xl font-semibold">{stats.totalItems}</p>
            <p className="text-sm text-muted-foreground">Total items</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-2xl font-semibold">{stats.totalCollections}</p>
            <p className="text-sm text-muted-foreground">Collections</p>
          </div>
        </div>

        <h3 className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          By type
        </h3>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.breakdown.map((type) => {
            const Icon = itemTypeIcons[type.icon];
            return (
              <li
                key={type.slug}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
                {Icon && (
                  <Icon
                    className="size-4 shrink-0"
                    style={{ color: type.color }}
                  />
                )}
                <span className="flex-1 truncate text-sm">{type.name}</span>
                <span className="text-sm font-medium tabular-nums">
                  {type.count}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Account actions */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Account
        </h2>

        {user.hasPassword && (
          <div className="mt-4">
            <h3 className="text-sm font-medium">Change password</h3>
            <div className="mt-3">
              <ChangePasswordForm />
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-destructive">Danger zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete your account and all of your data.
          </p>
          <div className="mt-3">
            <DeleteAccountDialog email={user.email} />
          </div>
        </div>
      </section>
    </main>
  );
}
