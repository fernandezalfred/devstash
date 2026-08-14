import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { auth } from "@/auth";
import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
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
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Items ({items.length})
            </h2>
            {items.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No favorited items.
              </p>
            ) : (
              <div className="divide-y divide-border border-y border-border">
                {items.map((item) => (
                  <FavoriteItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Collections ({collections.length})
            </h2>
            {collections.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No favorited collections.
              </p>
            ) : (
              <div className="divide-y divide-border border-y border-border">
                {collections.map((collection) => (
                  <FavoriteCollectionRow key={collection.id} collection={collection} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
