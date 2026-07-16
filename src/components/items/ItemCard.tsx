"use client";

import { useEffect, useState } from "react";

import { Check, Copy, Pin, Star } from "lucide-react";

import { useItemDrawer } from "@/components/items/ItemDrawer";
import { type DashboardItem } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/item-icons";

function formatItemDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// A single item rendered as a card for the item list view. The left border and
// icon are color-coded by the item's type, matching the ItemRow accent pattern.
export function ItemCard({ item }: { item: DashboardItem }) {
  const Icon = itemTypeIcons[item.typeIcon];
  const accent = item.typeColor;
  const { open } = useItemDrawer();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  // What a quick copy grabs: the text body for text types, the URL for links.
  const copyText = item.content ?? item.url;

  async function handleCopy(event: React.MouseEvent) {
    event.stopPropagation();
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable (permissions/insecure origin); ignore.
    }
  }

  return (
    // A div instead of a <button> so the quick-copy <button> isn't nested
    // inside a button (invalid HTML); keyboard access mirrors a button.
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
      className="group flex h-full cursor-pointer flex-col gap-3 rounded-lg border border-l-4 border-border bg-card p-4 text-left transition-colors hover:border-foreground/20 focus-visible:border-foreground/20 focus-visible:outline-none"
      style={{ borderLeftColor: accent }}
    >
      <div className="flex items-start gap-3">
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
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {copyText && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy"}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {formatItemDate(item.updatedAt)}
          </span>
        </div>
      </div>
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
  );
}
