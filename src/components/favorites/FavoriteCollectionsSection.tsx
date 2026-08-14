"use client";

import { useMemo, useState } from "react";

import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import { Select } from "@/components/ui/select";
import { type DashboardCollection } from "@/lib/db/collections";

type SortKey = "date" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date", label: "Date favorited" },
  { value: "name", label: "Name" },
];

function sortCollections(
  collections: DashboardCollection[],
  sort: SortKey,
): DashboardCollection[] {
  const sorted = [...collections];
  if (sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    sorted.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }
  return sorted;
}

// Client-side sortable wrapper around the Collections section of /favorites.
// No "Type" axis here (unlike FavoriteItemsSection) — collections aren't
// typed. The full list is already fetched server-side (no pagination), so
// sorting is a pure client-side reorder with no fetch/reload.
export function FavoriteCollectionsSection({
  collections,
}: {
  collections: DashboardCollection[];
}) {
  const [sort, setSort] = useState<SortKey>("date");
  const sorted = useMemo(
    () => sortCollections(collections, sort),
    [collections, sort],
  );

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Collections ({collections.length})
        </h2>
        {collections.length > 1 && (
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
      {collections.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          No favorited collections.
        </p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {sorted.map((collection) => (
            <FavoriteCollectionRow key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </section>
  );
}
