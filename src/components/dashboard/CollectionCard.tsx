import Link from "next/link";
import { Star } from "lucide-react";

import { collectionTypes, dominantType } from "@/lib/dashboard";
import { itemTypeIcons } from "@/lib/item-icons";
import { type Collection } from "@/lib/mock-data";

// A single collection card. Background is faintly tinted with the dominant item
// type's color; the bottom row shows an icon per item type present.
export function CollectionCard({ collection }: { collection: Collection }) {
  const types = collectionTypes(collection.id);
  const accent = dominantType(collection.id)?.color;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
      style={accent ? { backgroundColor: `${accent}0d` } : undefined}
    >
      <h3 className="flex items-center gap-1.5 font-medium">
        <span className="truncate">{collection.name}</span>
        {collection.isFavorite && (
          <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {collection.itemCount} items
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
