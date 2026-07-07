import { notFound } from "next/navigation";

import { ItemCard } from "@/components/items/ItemCard";
import { getItemsByType } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/item-icons";

// Render per-request so the list reflects the current DB state instead of baking
// data in at build time.
export const dynamic = "force-dynamic";

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: slug } = await params;
  const { type, items } = await getItemsByType(slug);

  // Unknown type slug (not one of the system types) → 404.
  if (!type) notFound();

  const Icon = itemTypeIcons[type.icon];
  const accent = type.color;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No {type.name.toLowerCase()} items yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
