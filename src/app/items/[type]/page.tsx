import { notFound, redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { FileRow } from "@/components/items/FileRow";
import { ImageCard } from "@/components/items/ImageCard";
import { ItemCard } from "@/components/items/ItemCard";
import { PaginationControls } from "@/components/pagination/PaginationControls";
import { BillingSection } from "@/components/settings/BillingSection";
import { getCollectionsForPicker } from "@/lib/db/collections";
import { getItemsByType, getSidebarItemTypes } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/users";
import { itemTypeIcons } from "@/lib/item-icons";
import { parsePageParam } from "@/lib/pagination";
import { checkTypeAllowed } from "@/lib/plan";

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
  // below always get a real userId. getCurrentUser() (DB-backed) rather than
  // the raw auth() JWT, since the Pro-gating badge below needs a fresh isPro.
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [{ type, items, currentPage, totalPages }, sidebarTypes, collectionOptions] =
    await Promise.all([
      getItemsByType(slug, user.id, page),
      getSidebarItemTypes(user.id),
      getCollectionsForPicker(user.id),
    ]);

  // Unknown type slug (not one of the system types) → 404.
  if (!type) notFound();

  // Same gate as POST /api/upload — a free user can't create file/image
  // items, so don't show them the list/pagination for those types either
  // (they could otherwise reach this page directly by URL even though the
  // Sidebar already routes them to /settings instead of linking here).
  const typeGate = checkTypeAllowed(user.isPro, type.name.toLowerCase());

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
        {typeGate.ok && (
          <CreateItemDialog
            types={sidebarTypes}
            collections={collectionOptions}
            initialType={type.name.toLowerCase()}
            triggerLabel={`New ${type.name}`}
            isPro={user.isPro}
          />
        )}
      </div>

      {!typeGate.ok ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border p-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-yellow-400/15">
            <Sparkles className="size-6 text-yellow-400" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {type.name} uploads are a Pro feature
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Upgrade to DevStash Pro to upload and organize{" "}
              {type.name.toLowerCase()}s — plus unlimited items and
              collections.
            </p>
          </div>
          <BillingSection isPro={user.isPro} />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
