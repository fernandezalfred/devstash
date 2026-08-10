import { redirect } from "next/navigation";

import { CollectionsGrid } from "@/components/dashboard/CollectionsGrid";
import { PinnedItems } from "@/components/dashboard/PinnedItems";
import { RecentItems } from "@/components/dashboard/RecentItems";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { auth } from "@/auth";
import { getCollectionStats, getDashboardCollections } from "@/lib/db/collections";
import {
  getItemStats,
  getPinnedItems,
  getRecentItems,
} from "@/lib/db/items";
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  DASHBOARD_RECENT_ITEMS_LIMIT,
} from "@/lib/pagination";

// Render per-request so the dashboard reflects the current DB state instead of
// baking data in at build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // The layout already redirects unauthenticated users, but guard here too so
  // getDashboardCollections always gets a real userId.
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [collections, collectionStats, pinnedItems, recentItems, itemStats] =
    await Promise.all([
      getDashboardCollections(session.user.id, DASHBOARD_COLLECTIONS_LIMIT),
      getCollectionStats(session.user.id),
      getPinnedItems(session.user.id),
      getRecentItems(session.user.id, DASHBOARD_RECENT_ITEMS_LIMIT),
      getItemStats(session.user.id),
    ]);

  const stats = {
    items: itemStats.items,
    collections: collectionStats.total,
    favoriteItems: itemStats.favoriteItems,
    favoriteCollections: collectionStats.favorites,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      <StatsCards stats={stats} />
      <CollectionsGrid collections={collections} />
      <PinnedItems items={pinnedItems} />
      <RecentItems items={recentItems} />
    </div>
  );
}
