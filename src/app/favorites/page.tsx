import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { auth } from "@/auth";
import { FavoriteCollectionsSection } from "@/components/favorites/FavoriteCollectionsSection";
import { FavoriteItemsSection } from "@/components/favorites/FavoriteItemsSection";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";

// Render per-request so the list reflects the current DB state instead of
// baking data in at build time.
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  // The parent layout already redirects unauthenticated users, but this page
  // has no local session read otherwise — add one so the queries below always
  // get a real userId.
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [items, collections] = await Promise.all([
    getFavoriteItems(session.user.id),
    getFavoriteCollections(session.user.id),
  ]);

  const isEmpty = items.length === 0 && collections.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 font-mono">
      <h1 className="text-lg font-semibold">Favorites</h1>

      {isEmpty ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Star className="mx-auto mb-2 size-5" />
          No favorites yet. Star an item or collection to see it here.
        </div>
      ) : (
        <>
          <FavoriteItemsSection items={items} />
          <FavoriteCollectionsSection collections={collections} />
        </>
      )}
    </div>
  );
}
