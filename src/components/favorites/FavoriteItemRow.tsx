"use client";

import { useItemDrawer } from "@/components/items/ItemDrawer";
import { type DashboardItem } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/item-icons";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// A favorited item, rendered as a dense terminal-style row: type icon, title,
// a type badge, and the date it was last favorited (updatedAt, since there's
// no dedicated favoritedAt column). Clicking opens the item drawer, matching
// the rest of the app's item-row click behavior.
export function FavoriteItemRow({ item }: { item: DashboardItem }) {
  const { open } = useItemDrawer();
  const Icon = itemTypeIcons[item.typeIcon];
  const accent = item.typeColor;
  const typeName = item.slug.replace(/s$/, "");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => open(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(item.id);
        }
      }}
      className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
    >
      {Icon && (
        <Icon className="size-4 shrink-0" style={{ color: accent }} />
      )}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        {typeName}
      </span>
      <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
        {formatDate(item.updatedAt)}
      </span>
    </div>
  );
}
