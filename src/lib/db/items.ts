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

// A system item type for the sidebar Types list, with the demo user's count.
export interface SidebarItemType {
  id: string;
  name: string; // display singular, e.g. "Snippet"
  slug: string; // route slug, e.g. "snippets"
  icon: string; // lucide icon name
  color: string; // hex
  itemCount: number;
}

// System item type order for the sidebar — matches the dashboard screenshot
// (links last) rather than the DB insertion order.
const SYSTEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

// System item types with the demo user's item count for each, ordered for the
// sidebar. Types with no items still appear (count 0).
export async function getSidebarItemTypes(): Promise<SidebarItemType[]> {
  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({ where: { isSystem: true, userId: null } }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { user: { email: DEMO_USER_EMAIL } },
      _count: { _all: true },
    }),
  ]);

  const countByTypeId = new Map(
    counts.map((entry) => [entry.itemTypeId, entry._count._all]),
  );

  return types
    .sort(
      (a, b) =>
        SYSTEM_TYPE_ORDER.indexOf(a.name) - SYSTEM_TYPE_ORDER.indexOf(b.name),
    )
    .map((type) => ({
      id: type.id,
      name: type.name.charAt(0).toUpperCase() + type.name.slice(1),
      slug: `${type.name}s`,
      icon: type.icon,
      color: type.color,
      itemCount: countByTypeId.get(type.id) ?? 0,
    }));
}

export interface ItemsByType {
  // The resolved system item type for the slug, or null when the slug doesn't
  // map to a system type (the page renders a 404 in that case).
  type: SidebarItemType | null;
  items: DashboardItem[];
}

// Items of a single system type for the demo user, most recently updated first,
// plus the resolved type metadata. `slug` is the plural route slug ("snippets").
export async function getItemsByType(slug: string): Promise<ItemsByType> {
  // Route slugs are the pluralized type name; system type names are lowercase
  // singular ("snippet"). Strip the trailing "s" to recover the type name.
  const name = slug.replace(/s$/, "");

  const itemType = await prisma.itemType.findFirst({
    where: { name, isSystem: true, userId: null },
  });
  if (!itemType) return { type: null, items: [] };

  const items = await prisma.item.findMany({
    where: { user: { email: DEMO_USER_EMAIL }, itemTypeId: itemType.id },
    orderBy: { updatedAt: "desc" },
    include: itemInclude,
  });

  return {
    type: {
      id: itemType.id,
      name: itemType.name.charAt(0).toUpperCase() + itemType.name.slice(1),
      slug: `${itemType.name}s`,
      icon: itemType.icon,
      color: itemType.color,
      itemCount: items.length,
    },
    items: items.map(toDashboardItem),
  };
}

// Full detail for a single item, loaded on demand when the drawer opens.
// Extends the card-level fields with content, url, language, collections, and
// timestamps that the list views don't need.
export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  fileName: string | null;
  language: string | null;
  contentType: "TEXT" | "FILE";
  isPinned: boolean;
  isFavorite: boolean;
  type: {
    name: string; // display singular, e.g. "Snippet"
    icon: string; // lucide icon name
    color: string; // hex
    slug: string; // route slug, e.g. "snippets"
  };
  tags: string[];
  collections: { id: string; name: string }[];
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// Relations needed to build an ItemDetail. Shared by getItemDetail and
// updateItem so both return the same shape.
const itemDetailInclude = {
  itemType: { select: { name: true, icon: true, color: true } },
  tags: { select: { name: true } },
  collections: {
    include: { collection: { select: { id: true, name: true } } },
  },
} as const;

type ItemWithDetail = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  fileName: string | null;
  language: string | null;
  contentType: "TEXT" | "FILE";
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: { name: string; icon: string; color: string };
  tags: { name: string }[];
  collections: { collection: { id: string; name: string } }[];
};

function toItemDetail(item: ItemWithDetail): ItemDetail {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    url: item.url,
    fileName: item.fileName,
    language: item.language,
    contentType: item.contentType,
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    type: {
      name:
        item.itemType.name.charAt(0).toUpperCase() + item.itemType.name.slice(1),
      icon: item.itemType.icon,
      color: item.itemType.color,
      slug: `${item.itemType.name}s`,
    },
    tags: item.tags.map((tag) => tag.name),
    collections: item.collections.map((ic) => ({
      id: ic.collection.id,
      name: ic.collection.name,
    })),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// Full detail for a single item, demo-user-scoped to match the list views
// (getPinnedItems / getRecentItems / getItemsByType). Returns null when the item
// doesn't exist under the demo user, so the API route can 404. Swap to the
// authenticated session user once the rest of the data layer moves off the demo
// user — until then, scoping to the session user here would 404 every card,
// since the lists show demo items regardless of who is signed in.
export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id, user: { email: DEMO_USER_EMAIL } },
    include: itemDetailInclude,
  });
  if (!item) return null;
  return toItemDetail(item);
}

// Fields an item edit can change. Type-specific fields (content/language/url)
// are always present in the payload but null for types that don't use them.
export interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
}

// Update an item and return its fresh ItemDetail (so the drawer can refresh
// without a second fetch), or null when the item isn't found under the demo
// user. Demo-user-scoped to match getItemDetail — the calling server action
// still requires an authenticated session. Tags are replaced wholesale:
// disconnect all, then connect-or-create by unique name.
export async function updateItem(
  id: string,
  data: UpdateItemData,
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id, user: { email: DEMO_USER_EMAIL } },
    select: { id: true },
  });
  if (!existing) return null;

  const item = await prisma.item.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        set: [],
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: itemDetailInclude,
  });
  return toItemDetail(item);
}

// Delete an item, demo-user-scoped (matching getItemDetail/updateItem — the
// calling action still requires an authenticated session). Returns false when
// the item isn't found under the demo user so the action can report not-found.
// ItemCollection join rows drop via onDelete: Cascade and the implicit ItemTags
// join rows are removed by Prisma; shared Tag rows are left intact.
export async function deleteItem(id: string): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id, user: { email: DEMO_USER_EMAIL } },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.item.delete({ where: { id } });
  return true;
}

// Fields for creating an item. `type` is the system item type name (lowercase
// singular, e.g. "snippet"). All five creatable types are TEXT-kind; link
// stores its `url` with null content.
export interface CreateItemData {
  type: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
}

// Create an item under the demo user and return its ItemDetail, or null when
// `type` isn't a system type. Demo-user-scoped to match the rest of the layer —
// the calling action still requires an authenticated session. Tags are
// connect-or-created by unique name.
export async function createItem(
  data: CreateItemData,
): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.type, isSystem: true, userId: null },
    select: { id: true },
  });
  if (!itemType) return null;

  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  if (!user) return null;

  const item = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      contentType: "TEXT",
      userId: user.id,
      itemTypeId: itemType.id,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: itemDetailInclude,
  });
  return toItemDetail(item);
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
