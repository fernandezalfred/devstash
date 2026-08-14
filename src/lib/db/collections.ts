// Dashboard collection data, fetched from the database via Prisma.
// Replaces the mock collections in @/lib/mock-data for the dashboard main area.

import { cache } from "react";

import { COLLECTIONS_PER_PAGE, resolvePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

// A distinct item type present in a collection, with the bits the card needs.
export interface CollectionTypeSummary {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // hex
}

export interface DashboardCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  types: CollectionTypeSummary[]; // distinct types present, most-frequent first
  accentColor: string | null; // dominant (most-used) type's color
  updatedAt: string; // ISO date
}

// What the collection-tallying queries below need from the database. The 7
// system types are constant, so only pull the fields the card needs instead
// of every column of itemType for every item.
// Scalar fields (e.g. updatedAt) are returned automatically alongside this —
// `include` only needs to name relations, unlike `select`.
const collectionWithItemTypesInclude = {
  items: {
    select: {
      item: {
        select: {
          itemType: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      },
    },
  },
} as const;

type CollectionWithItemTypes = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  items: { item: { itemType: CollectionTypeSummary } }[];
};

// Tallies a collection's items per type to find the distinct types present
// and the dominant one (drives the card's accent color).
function toDashboardCollection(
  collection: CollectionWithItemTypes,
): DashboardCollection {
  const counts = new Map<string, { type: CollectionTypeSummary; count: number }>();
  for (const { item } of collection.items) {
    const { id, name, icon, color } = item.itemType;
    const existing = counts.get(id);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(id, { type: { id, name, icon, color }, count: 1 });
    }
  }

  const ranked = [...counts.values()].sort((a, b) => b.count - a.count);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection.items.length,
    types: ranked.map((entry) => entry.type),
    accentColor: ranked[0]?.type.color ?? null,
    updatedAt: collection.updatedAt.toISOString(),
  };
}

// Collections for the given (authenticated) user, most recently updated
// first — see createCollection below for the matching scoping. With no
// `limit`, returns every collection (the sidebar's Favorites/Recents lists
// need the full set to split client-side). With a `limit`, only that many
// are fetched via a DB-level `take` (the dashboard's capped grid). Wrapped in
// React's cache() so callers within one request that pass the same args
// (e.g. the layout's sidebar fetch) share one query instead of issuing it
// twice — a distinct `limit` is a distinct cache key, so the dashboard's
// capped call is a separate query from the sidebar's unbounded one.
export const getDashboardCollections = cache(
  async (userId: string, limit?: number): Promise<DashboardCollection[]> => {
    const collections = await prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      ...(limit ? { take: limit } : {}),
      include: collectionWithItemTypesInclude,
    });

    return collections.map(toDashboardCollection);
  },
);

// All of a user's favorited collections, most recently updated first (see
// getFavoriteItems in items.ts for the same "updatedAt as favorited-at proxy"
// note). Fetches the full set, no pagination, matching the favorites page spec.
export async function getFavoriteCollections(
  userId: string,
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    include: collectionWithItemTypesInclude,
  });
  return collections.map(toDashboardCollection);
}

export interface DashboardCollectionStats {
  total: number;
  favorites: number;
}

// Total/favorite collection counts for the dashboard stats cards — count
// queries, decoupled from getDashboardCollections' (possibly capped) grid
// fetch so the stats stay accurate regardless of the grid's `limit`.
export async function getCollectionStats(
  userId: string,
): Promise<DashboardCollectionStats> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);
  return { total, favorites };
}

export interface CollectionsPage {
  collections: DashboardCollection[];
  currentPage: number;
  totalPages: number;
}

// A single page of the given user's collections for the /collections list
// page, most recently updated first. `page` is 1-indexed and clamped to the
// valid range. Only fetches the requested page, never the full list.
export async function getCollectionsPage(
  userId: string,
  page = 1,
): Promise<CollectionsPage> {
  const totalCount = await prisma.collection.count({ where: { userId } });
  const { currentPage, totalPages } = resolvePage(
    totalCount,
    page,
    COLLECTIONS_PER_PAGE,
  );

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    skip: (currentPage - 1) * COLLECTIONS_PER_PAGE,
    take: COLLECTIONS_PER_PAGE,
    include: collectionWithItemTypesInclude,
  });

  return {
    collections: collections.map(toDashboardCollection),
    currentPage,
    totalPages,
  };
}

export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}

// A single collection's metadata for the /collections/[id] page, scoped to the
// given (authenticated) user — matches getDashboardCollections's scoping.
// Returns null when the collection doesn't exist or isn't owned by that user,
// so the page can 404 rather than leaking another user's collection.
export async function getCollectionDetail(
  id: string,
  userId: string,
): Promise<CollectionDetail | null> {
  return prisma.collection.findFirst({
    where: { id, userId },
    select: { id: true, name: true, description: true, isFavorite: true },
  });
}

export interface CollectionOption {
  id: string;
  name: string;
}

// Lightweight collection list for the item create/edit forms' picker, scoped
// to the given user. Wrapped in cache() since it's fetched once per relevant
// layout/page and again by any type page that renders its own
// CreateItemDialog (cache() keys on arguments, so this still dedupes
// correctly per userId).
export const getCollectionsForPicker = cache(
  async (userId: string): Promise<CollectionOption[]> => {
    return prisma.collection.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  },
);

// Create a collection owned by the given (authenticated) user.
export async function createCollection(
  userId: string,
  input: { name: string; description: string | null },
): Promise<{ id: string; name: string; description: string | null }> {
  const collection = await prisma.collection.create({
    data: {
      name: input.name,
      description: input.description,
      userId,
    },
    select: { id: true, name: true, description: true },
  });
  return collection;
}

// Update a collection's metadata (name/description), scoped to the given
// (authenticated) owner. updateMany + a count check (rather than update, which
// throws on no match) so an unknown id or another user's collection cleanly
// returns null instead of a 500.
export async function updateCollection(
  id: string,
  userId: string,
  input: { name: string; description: string | null },
): Promise<{ id: string; name: string; description: string | null } | null> {
  const result = await prisma.collection.updateMany({
    where: { id, userId },
    data: { name: input.name, description: input.description },
  });
  if (result.count === 0) return null;
  return { id, name: input.name, description: input.description };
}

// Delete a collection, scoped to the given (authenticated) owner. Only the
// collection and its ItemCollection join rows are removed (the join's
// `collection` relation cascades — see schema.prisma); the items themselves,
// and their membership in any other collections, are left untouched. Returns
// false if the collection doesn't exist or isn't owned by that user.
export async function deleteCollection(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.collection.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
