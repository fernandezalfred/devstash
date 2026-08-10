import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { FileRow } from "@/components/items/FileRow";
import { ImageCard } from "@/components/items/ImageCard";
import { ItemCard } from "@/components/items/ItemCard";
import { PaginationControls } from "@/components/pagination/PaginationControls";
import { getCollectionsForPicker } from "@/lib/db/collections";
import { getItemsByType, getSidebarItemTypes } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/item-icons";
import { parsePageParam } from "@/lib/pagination";

// Render per-request so the list reflects the current DB state instead of baking
// data in at build time.
export const dynamic = "force-dynamic";

export default async function ItemsByTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { type: slug } = await params;
  const page = parsePageParam((await searchParams).page);

  // The parent items/layout.tsx already redirects unauthenticated users, but
  // this page has no local session read otherwise — add one so the queries
  // below always get a real userId.
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [{ type, items, currentPage, totalPages }, sidebarTypes, collectionOptions] =
    await Promise.all([
      getItemsByType(slug, session.user.id, page),
      getSidebarItemTypes(session.user.id),
      getCollectionsForPicker(session.user.id),
    ]);

  // Unknown type slug (not one of the system types) → 404.
  if (!type) notFound();

  const Icon = itemTypeIcons[type.icon];
  const accent = type.color;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${accent}1a` }}
          >
            {Icon && <Icon className="size-5" style={{ color: accent }} />}
          </span>
          <div>
            <h1 className="text-2xl font-semibold">{type.name}s</h1>
            <p className="text-sm text-muted-foreground">
              {type.itemCount} {type.itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        <CreateItemDialog
          types={sidebarTypes}
          collections={collectionOptions}
          initialType={type.name.toLowerCase()}
          triggerLabel={`New ${type.name}`}
        />
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No {type.name.toLowerCase()} items yet.
        </p>
      ) : type.slug === "files" ? (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {items.map((item) => (
            <FileRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) =>
            type.slug === "images" ? (
              <ImageCard key={item.id} item={item} />
            ) : (
              <ItemCard key={item.id} item={item} />
            ),
          )}
        </div>
      )}

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/items/${type.slug}`}
      />
    </div>
  );
}
