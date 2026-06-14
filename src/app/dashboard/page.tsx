import { CollectionsGrid } from "@/components/dashboard/CollectionsGrid";
import { PinnedItems } from "@/components/dashboard/PinnedItems";
import { RecentItems } from "@/components/dashboard/RecentItems";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { getDashboardCollections } from "@/lib/db/collections";
import {
  getItemStats,
  getPinnedItems,
  getRecentItems,
} from "@/lib/db/items";

// Render per-request so the dashboard reflects the current DB state instead of
// baking data in at build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [collections, pinnedItems, recentItems, itemStats] = await Promise.all([
    getDashboardCollections(),
    getPinnedItems(),
    getRecentItems(),
    getItemStats(),
  ]);

  const stats = {
    items: itemStats.items,
    collections: collections.length,
    favoriteItems: itemStats.favoriteItems,
    favoriteCollections: collections.filter((c) => c.isFavorite).length,
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
