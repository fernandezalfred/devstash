import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CollectionsGrid } from "@/components/dashboard/CollectionsGrid";
import { getDashboardCollections } from "@/lib/db/collections";

// Render per-request so the list reflects the current DB state instead of
// baking data in at build time.
export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  // The layout already redirects unauthenticated users, but guard here too so
  // getDashboardCollections always gets a real userId.
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const collections = await getDashboardCollections(session.user.id);

  return (
    <div className="mx-auto max-w-6xl">
      <CollectionsGrid collections={collections} />
    </div>
  );
}
