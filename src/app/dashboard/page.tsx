import { CollectionsGrid } from "@/components/dashboard/CollectionsGrid";
import { PinnedItems } from "@/components/dashboard/PinnedItems";
import { RecentItems } from "@/components/dashboard/RecentItems";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { dashboardStats } from "@/lib/dashboard";
import { getDashboardCollections } from "@/lib/db/collections";

// Render per-request so the dashboard reflects the current DB state instead of
// baking collections in at build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const collections = await getDashboardCollections();

  // Collection stats come from the database; item stats are still mock until
  // items are migrated off mock-data.
  const stats = {
    items: dashboardStats.items,
    collections: collections.length,
    favoriteItems: dashboardStats.favoriteItems,
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
      <PinnedItems />
      <RecentItems />
    </div>
  );
}
