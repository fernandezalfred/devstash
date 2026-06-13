// Dashboard collection data, fetched from the database via Prisma.
// Replaces the mock collections in @/lib/mock-data for the dashboard main area.

import { prisma } from "@/lib/prisma";

// No auth yet — the dashboard is scoped to the seeded demo user. Swap this for
// the authenticated session user once NextAuth is wired up.
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

// Recent collections for the dashboard, most recently updated first.
export async function getDashboardCollections(): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { user: { email: DEMO_USER_EMAIL } },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true },
          },
        },
      },
    },
  });

  return collections.map((collection) => {
    // Tally items per type to find the distinct types present and the dominant
    // one (drives the card's accent color).
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
}
