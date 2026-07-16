"use client";

import { useState } from "react";

import { ImageOff, Pin, Star } from "lucide-react";

import { useItemDrawer } from "@/components/items/ItemDrawer";
import { type DashboardItem } from "@/lib/db/items";

function formatItemDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Gallery card for image items: a 16:9 thumbnail (served inline through the
// download proxy so the bucket stays private) above a compact title/meta row.
// Replaces ItemCard on the images page.
export function ImageCard({ item }: { item: DashboardItem }) {
  const { open } = useItemDrawer();
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => open(item.id)}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-foreground/20"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {failed ? (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        ) : (
          /* Plain <img>: next/image's optimizer fetches server-side without the
             session cookie, so it can't read the auth-gated download proxy. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/items/${item.id}/download`}
            alt={item.title}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{item.title}</span>
          {item.isPinned && (
            <Pin className="size-3 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {formatItemDate(item.updatedAt)}
          </span>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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
    </button>
  );
}
