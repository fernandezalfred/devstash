import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CollectionHeaderActions } from "@/components/dashboard/CollectionHeaderActions";
import { FileRow } from "@/components/items/FileRow";
import { ImageCard } from "@/components/items/ImageCard";
import { ItemCard } from "@/components/items/ItemCard";
import { getCollectionDetail } from "@/lib/db/collections";
import { getItemsByCollection, type DashboardItem } from "@/lib/db/items";

// Render per-request so the collection reflects the current DB state instead
// of baking data in at build time.
export const dynamic = "force-dynamic";

// Matches the sidebar/type-order convention (links last) rather than DB order.
const TYPE_SLUG_ORDER = [
  "snippets",
  "prompts",
  "commands",
  "notes",
  "files",
  "images",
  "links",
];

// A collection can mix item types (unlike /items/[type], always single-type),
// so items are grouped by type and each group keeps its existing card
// treatment (ItemCard grid / ImageCard grid / FileRow list).
function groupByTypeSlug(items: DashboardItem[]): [string, DashboardItem[]][] {
  const groups = new Map<string, DashboardItem[]>();
  for (const item of items) {
    const group = groups.get(item.slug);
    if (group) group.push(item);
    else groups.set(item.slug, [item]);
  }
  return [...groups.entries()].sort(
    ([a], [b]) => TYPE_SLUG_ORDER.indexOf(a) - TYPE_SLUG_ORDER.indexOf(b),
  );
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // The layout already redirects unauthenticated users, but guard here too so
  // getCollectionDetail always gets a real userId.
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [collection, items] = await Promise.all([
    getCollectionDetail(id, session.user.id),
    getItemsByCollection(id, session.user.id),
  ]);

  // Unknown id, or a collection that isn't owned by the signed-in user → 404
  // rather than leaking another user's collection.
  if (!collection) notFound();

  const groups = groupByTypeSlug(items);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{collection.name}</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
          {collection.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {collection.description}
            </p>
          )}
        </div>
        <CollectionHeaderActions collection={collection} />
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No items in this collection yet.
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map(([slug, groupItems]) => (
            <section key={slug}>
              <h2 className="mb-3 text-lg font-semibold capitalize">{slug}</h2>
              {slug === "files" ? (
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                  {groupItems.map((item) => (
                    <FileRow key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {groupItems.map((item) =>
                    slug === "images" ? (
                      <ImageCard key={item.id} item={item} />
                    ) : (
                      <ItemCard key={item.id} item={item} />
                    ),
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
