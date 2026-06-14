// Dashboard item data, fetched from the database via Prisma.
// Replaces the mock items in @/lib/mock-data for the dashboard main area.

import { prisma } from "@/lib/prisma";

// No auth yet — the dashboard is scoped to the seeded demo user. Swap this for
// the authenticated session user once NextAuth is wired up.
const DEMO_USER_EMAIL = "demo@devstash.io";

export interface DashboardItem {
  id: string;
  title: string;
  description: string | null;
  slug: string; // route slug derived from the item type (e.g. "snippets")
  typeIcon: string; // lucide icon name
  typeColor: string; // hex
  isPinned: boolean;
  isFavorite: boolean;
  tags: string[];
  updatedAt: string; // ISO date
}

// What each query needs from the database to build a DashboardItem.
const itemInclude = {
  itemType: true,
  tags: { select: { name: true } },
} as const;

type ItemWithRelations = {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: Date;
  itemType: { name: string; icon: string; color: string };
  tags: { name: string }[];
};

function toDashboardItem(item: ItemWithRelations): DashboardItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    // System item type names are lowercase singular ("snippet"); the item list
    // routes are the pluralized slug ("snippets").
    slug: `${item.itemType.name}s`,
    typeIcon: item.itemType.icon,
    typeColor: item.itemType.color,
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    tags: item.tags.map((tag) => tag.name),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// Pinned items for the demo user, most recently updated first.
export async function getPinnedItems(): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { user: { email: DEMO_USER_EMAIL }, isPinned: true },
    orderBy: { updatedAt: "desc" },
    include: itemInclude,
  });
  return items.map(toDashboardItem);
}

// The most recently updated items for the demo user.
export async function getRecentItems(limit = 10): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { user: { email: DEMO_USER_EMAIL } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: itemInclude,
  });
  return items.map(toDashboardItem);
}

export interface DashboardItemStats {
  items: number;
  favoriteItems: number;
}

// Item totals for the dashboard stats cards.
export async function getItemStats(): Promise<DashboardItemStats> {
  const [items, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { user: { email: DEMO_USER_EMAIL } } }),
    prisma.item.count({
      where: { user: { email: DEMO_USER_EMAIL }, isFavorite: true },
    }),
  ]);
  return { items, favoriteItems };
}
