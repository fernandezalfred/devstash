// Dashboard collection data, fetched from the database via Prisma.
// Replaces the mock collections in @/lib/mock-data for the dashboard main area.

import { cache } from "react";

import { prisma } from "@/lib/prisma";

// Items are still created/edited under the demo user (see src/lib/db/items.ts),
// so the item form's collection picker must list the demo user's own
// collections to match — not the real signed-in user's (see
// getDashboardCollections below, which is real-user-scoped for a different
// caller). Duplicating this constant rather than sharing it with items.ts
// matches the existing pattern there.
const DEMO_USER_EMAIL = "demo@devstash.io";

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
}

// Recent collections for the dashboard, most recently updated first, scoped
// to the given (authenticated) user — see createCollection below for the
// matching scoping. Wrapped in React's cache() so the layout (sidebar) and
// page (main grid) share one query per request instead of issuing it twice
// (cache() keys on arguments, so this still dedupes correctly per userId).
export const getDashboardCollections = cache(
  async (userId: string): Promise<DashboardCollection[]> => {
    const collections = await prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          // The 7 system types are constant, so only pull the fields the card
          // needs instead of every column of itemType for every item.
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
      },
    });

    return collections.map((collection) => {
      // Tally items per type to find the distinct types present and the
      // dominant one (drives the card's accent color).
      const counts = new Map<
        string,
        { type: CollectionTypeSummary; count: number }
      >();
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
      };
    });
  },
);

export interface CollectionOption {
  id: string;
  name: string;
}

// Lightweight collection list for the item create/edit forms' picker,
// demo-user-scoped to match item ownership (see the note above). Wrapped in
// cache() since it's fetched once per relevant layout/page and again by any
// type page that renders its own CreateItemDialog.
export const getCollectionsForPicker = cache(
  async (): Promise<CollectionOption[]> => {
    return prisma.collection.findMany({
      where: { user: { email: DEMO_USER_EMAIL } },
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
