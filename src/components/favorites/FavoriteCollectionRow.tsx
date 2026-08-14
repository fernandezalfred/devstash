import { Folder } from "lucide-react";
import Link from "next/link";

import { type DashboardCollection } from "@/lib/db/collections";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// A favorited collection, rendered as a dense terminal-style row matching
// FavoriteItemRow: a folder icon (tinted by the collection's dominant item
// type when it has items), name, a "Collection" badge, and the date it was
// last favorited (updatedAt). Clicking navigates to the collection's page.
export function FavoriteCollectionRow({
  collection,
}: {
  collection: DashboardCollection;
}) {
  const accent = collection.accentColor ?? "var(--muted-foreground)";

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
    >
      <Folder className="size-4 shrink-0" style={{ color: accent }} />
      <span className="min-w-0 flex-1 truncate">{collection.name}</span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
        style={{ backgroundColor: `${collection.accentColor ?? "#6b7280"}1a`, color: accent }}
      >
        Collection
      </span>
      <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
        {formatDate(collection.updatedAt)}
      </span>
    </Link>
  );
}
