// Profile usage stats, fetched from the database via Prisma. Scoped to a
// specific (authenticated) user, unlike the demo-scoped dashboard helpers.

import { prisma } from "@/lib/prisma";

// A system item type with the user's item count for it.
export interface ProfileTypeBreakdown {
  name: string; // display singular, e.g. "Snippet"
  slug: string; // route slug, e.g. "snippets"
  icon: string; // lucide icon name
  color: string; // hex
  count: number;
}

export interface ProfileStats {
  totalItems: number;
  totalCollections: number;
  breakdown: ProfileTypeBreakdown[]; // all 7 system types, types with 0 included
}

// System item type order — matches the sidebar/screenshot (links last).
const SYSTEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

// Usage stats for a user: total items, total collections, and a per-type
// breakdown across all seven system types (types with no items show 0).
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [totalItems, totalCollections, types, counts] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({ where: { isSystem: true, userId: null } }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const countByTypeId = new Map(
    counts.map((entry) => [entry.itemTypeId, entry._count._all]),
  );

  const breakdown = types
    .sort(
      (a, b) =>
        SYSTEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_TYPE_ORDER.indexOf(b.name),
    )
    .map((type) => ({
      name: type.name.charAt(0).toUpperCase() + type.name.slice(1),
      slug: `${type.name}s`,
      icon: type.icon,
      color: type.color,
      count: countByTypeId.get(type.id) ?? 0,
    }));

  return { totalItems, totalCollections, breakdown };
}
