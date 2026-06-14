import Link from "next/link";
import { Pin, Star } from "lucide-react";

import { type DashboardItem } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/item-icons";

function formatItemDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// A single item row, shared by the Pinned and Recent sections. The left border
// and icon are color-coded by the item's type.
export function ItemRow({ item }: { item: DashboardItem }) {
  const Icon = itemTypeIcons[item.typeIcon];
  const accent = item.typeColor;

  return (
    <Link
      href={`/items/${item.slug}`}
      className="flex items-start gap-3 rounded-lg border border-l-2 border-border bg-card p-3 transition-colors hover:border-foreground/20"
      style={{ borderLeftColor: accent }}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${accent}1a` }}
      >
        {Icon && <Icon className="size-4" style={{ color: accent }} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{item.title}</span>
          {item.isPinned && (
            <Pin className="size-3 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatItemDate(item.updatedAt)}
      </span>
    </Link>
  );
}
