"use client";

import { useMemo, useState } from "react";

import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import { Select } from "@/components/ui/select";
import { type DashboardItem } from "@/lib/db/items";

type SortKey = "date" | "name" | "type";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date", label: "Date favorited" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
];

// Matches the sidebar/type-order convention used elsewhere (getSidebarItemTypes,
// /collections/[id]/page.tsx) rather than plain alphabetical, so "Type" sort
// groups items the same way the rest of the app orders types.
const TYPE_SLUG_ORDER = [
  "snippets",
  "prompts",
  "commands",
  "notes",
  "files",
  "images",
  "links",
];

function sortItems(items: DashboardItem[], sort: SortKey): DashboardItem[] {
  const sorted = [...items];
  switch (sort) {
    case "name":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "type":
      sorted.sort((a, b) => {
        const byType =
          TYPE_SLUG_ORDER.indexOf(a.slug) - TYPE_SLUG_ORDER.indexOf(b.slug);
        return byType !== 0 ? byType : a.title.localeCompare(b.title);
      });
      break;
    case "date":
      sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      break;
  }
  return sorted;
}

// Client-side sortable wrapper around the Items section of /favorites — the
// full list is already fetched server-side (no pagination), so sorting is a
// pure client-side reorder with no fetch/reload.
export function FavoriteItemsSection({ items }: { items: DashboardItem[] }) {
  const [sort, setSort] = useState<SortKey>("date");
  const sorted = useMemo(() => sortItems(items, sort), [items, sort]);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Items ({items.length})
        </h2>
        {items.length > 1 && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Sort
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-7 w-36 text-xs"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>
      {items.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          No favorited items.
        </p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {sorted.map((item) => (
            <FavoriteItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
