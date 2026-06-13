import Link from "next/link";
import { Star } from "lucide-react";

import { type DashboardCollection } from "@/lib/db/collections";
import { itemTypeIcons } from "@/lib/item-icons";

// A single collection card. A colored left border reflects the dominant item
// type; the bottom row shows an icon per item type present in the collection.
export function CollectionCard({
  collection,
}: {
  collection: DashboardCollection;
}) {
  const { accentColor, types } = collection;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group flex flex-col rounded-xl border border-l-4 border-border bg-card p-4 transition-colors hover:border-foreground/20"
      style={
        accentColor
          ? {
              borderLeftColor: accentColor,
              backgroundColor: `${accentColor}0d`,
            }
          : undefined
      }
    >
      <h3 className="flex items-center gap-1.5 font-medium">
        <span className="truncate">{collection.name}</span>
        {collection.isFavorite && (
          <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
      </p>
      {collection.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {collection.description}
        </p>
      )}
      {types.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {types.map((type) => {
            const Icon = itemTypeIcons[type.icon];
            return Icon ? (
              <Icon
                key={type.id}
                className="size-4"
                style={{ color: type.color }}
              />
            ) : null;
          })}
        </div>
      )}
    </Link>
  );
}
