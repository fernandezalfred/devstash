// Derived selectors over the mock data for the dashboard main area.
// Kept separate from mock-data.ts so that file stays plain data.

import {
  collections,
  items,
  itemTypes,
  type Collection,
  type Item,
  type ItemType,
} from "@/lib/mock-data";

const typeById = new Map(itemTypes.map((type) => [type.id, type]));

export function getItemType(typeId: string): ItemType | undefined {
  return typeById.get(typeId);
}

export function itemsInCollection(collectionId: string): Item[] {
  return items.filter((item) => item.collectionIds.includes(collectionId));
}

// Distinct item types present in a collection, ordered most-frequent first.
export function collectionTypes(collectionId: string): ItemType[] {
  const counts = new Map<string, number>();
  for (const item of itemsInCollection(collectionId)) {
    counts.set(item.typeId, (counts.get(item.typeId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([typeId]) => typeById.get(typeId))
    .filter((type): type is ItemType => Boolean(type));
}

// The most common item type in a collection — drives the card's accent color.
export function dominantType(collectionId: string): ItemType | undefined {
  return collectionTypes(collectionId)[0];
}

function byUpdatedDesc<T extends { updatedAt: string }>(a: T, b: T): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

// Recent collections, most recently updated first.
export const recentCollections: Collection[] = [...collections].sort(byUpdatedDesc);

export const pinnedItems: Item[] = items
  .filter((item) => item.isPinned)
  .sort(byUpdatedDesc);

export const recentItems: Item[] = [...items].sort(byUpdatedDesc).slice(0, 10);

export const dashboardStats = {
  items: itemTypes.reduce((sum, type) => sum + type.itemCount, 0),
  collections: collections.length,
  favoriteItems: items.filter((item) => item.isFavorite).length,
  favoriteCollections: collections.filter((collection) => collection.isFavorite)
    .length,
};

export function formatItemDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
