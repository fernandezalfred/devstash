import Link from "next/link";
import { redirect } from "next/navigation";

import { BillingSection } from "@/components/settings/BillingSection";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { CheckoutStatusToast } from "@/components/settings/CheckoutStatusToast";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { EditorPreferencesProvider } from "@/components/settings/EditorPreferencesContext";
import { EditorPreferencesSection } from "@/components/settings/EditorPreferencesSection";
import { getEditorPreferences, getProfileUser } from "@/lib/db/users";

// Protected by the proxy (matcher includes /settings), with a guard here too.
export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await getProfileUser();
  if (!user) redirect("/sign-in");

  const editorPreferences = await getEditorPreferences(user.id);
  const { checkout } = await searchParams;
  const checkoutStatus =
    checkout === "success" || checkout === "cancelled" ? checkout : null;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to dashboard
      </Link>

      <h1 className="text-xl font-semibold">Settings</h1>

      <CheckoutStatusToast status={checkoutStatus} />

      {/* Plan / billing */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Plan
        </h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">
              {user.isPro ? "Pro plan" : "Free plan"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.isPro
                ? "Unlimited items, collections, and file/image uploads."
                : "50 items, 3 collections. Upgrade for unlimited plus files & images."}
            </p>
          </div>
          <BillingSection isPro={user.isPro} />
        </div>
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

      <EditorPreferencesProvider initialPreferences={editorPreferences}>
        <EditorPreferencesSection />
      </EditorPreferencesProvider>
    </main>
  );
}
