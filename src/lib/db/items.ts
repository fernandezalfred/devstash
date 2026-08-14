// Dashboard item data, fetched from the database via Prisma.
// Replaces the mock items in @/lib/mock-data for the dashboard main area.

import { cache } from "react";

import {
  DASHBOARD_RECENT_ITEMS_LIMIT,
  ITEMS_PER_PAGE,
  resolvePage,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

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
  content: string | null; // text body (TEXT items)
  url: string | null; // link items
  fileName: string | null; // FILE items only
  fileSize: number | null; // FILE items only, bytes
  createdAt: string; // ISO date (upload date for FILE items)
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
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: Date;
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
    content: item.content,
    url: item.url,
    fileName: item.fileName,
    fileSize: item.fileSize,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// Pinned items for the given user, most recently updated first.
export async function getPinnedItems(userId: string): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    include: itemInclude,
  });
  return items.map(toDashboardItem);
}

// The most recently updated items for the given user.
export async function getRecentItems(
  userId: string,
  limit = DASHBOARD_RECENT_ITEMS_LIMIT,
): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: itemInclude,
  });
  return items.map(toDashboardItem);
}

// All of a user's favorited items, most recently updated first (used as the
// "most recently favorited" proxy — there's no dedicated favoritedAt column,
// and toggling isFavorite bumps updatedAt like any other write). Fetches the
// full set, no pagination, matching the favorites page spec.
export async function getFavoriteItems(userId: string): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    include: itemInclude,
  });
  return items.map(toDashboardItem);
}

// Lightweight item shape for the global command palette, scoped to the given
// user. Uses a nested `select` (not `include: { itemType: true }`, matching
// the 2026-06-19 audit fix elsewhere in this file) so it doesn't refetch
// every column of the constant 7 system types per item.
export interface SearchItem {
  id: string;
  title: string;
  typeName: string; // display singular, e.g. "Snippet"
  typeIcon: string; // lucide icon name
  typeColor: string; // hex
  preview: string | null; // content preview: description, else content/url
}

const SEARCH_PREVIEW_LENGTH = 140;

// All items for the given user (no pagination) — the palette pre-fetches this
// once and filters client-side, per the feature spec.
export async function getSearchableItems(
  userId: string,
): Promise<SearchItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      url: true,
      itemType: { select: { name: true, icon: true, color: true } },
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    typeName:
      item.itemType.name.charAt(0).toUpperCase() + item.itemType.name.slice(1),
    typeIcon: item.itemType.icon,
    typeColor: item.itemType.color,
    preview:
      item.description ??
      item.content?.slice(0, SEARCH_PREVIEW_LENGTH) ??
      item.url ??
      null,
  }));
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

// System item types with the given user's item count for each, ordered for the
// sidebar. Types with no items still appear (count 0). Wrapped in React's
// cache() so the layout (sidebar) and page (main grid) share one query per
// request instead of issuing it twice (cache() keys on arguments, so this
// still dedupes correctly per userId).
export const getSidebarItemTypes = cache(
  async (userId: string): Promise<SidebarItemType[]> => {
    const [types, counts] = await Promise.all([
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
  },
);

export interface ItemsByType {
  // The resolved system item type for the slug, or null when the slug doesn't
  // map to a system type (the page renders a 404 in that case). itemCount is
  // the type's total item count, not just this page's.
  type: SidebarItemType | null;
  items: DashboardItem[];
  currentPage: number;
  totalPages: number;
}

// A single page of items of one system type for the given user, most
// recently updated first, plus the resolved type metadata. `slug` is the
// plural route slug ("snippets"); `page` is 1-indexed and clamped to the
// valid range. Only fetches the requested page (count + a `skip`/`take`
// findMany), never the full list.
export async function getItemsByType(
  slug: string,
  userId: string,
  page = 1,
): Promise<ItemsByType> {
  // Route slugs are the pluralized type name; system type names are lowercase
  // singular ("snippet"). Strip the trailing "s" to recover the type name.
  const name = slug.replace(/s$/, "");

  const itemType = await prisma.itemType.findFirst({
    where: { name, isSystem: true, userId: null },
  });
  if (!itemType) return { type: null, items: [], currentPage: 1, totalPages: 1 };

  const where = { userId, itemTypeId: itemType.id };
  const totalCount = await prisma.item.count({ where });
  const { currentPage, totalPages } = resolvePage(totalCount, page, ITEMS_PER_PAGE);

  const items = await prisma.item.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: itemInclude,
  });

  return {
    type: {
      id: itemType.id,
      name: itemType.name.charAt(0).toUpperCase() + itemType.name.slice(1),
      slug: `${itemType.name}s`,
      icon: itemType.icon,
      color: itemType.color,
      itemCount: totalCount,
    },
    items: items.map(toDashboardItem),
    currentPage,
    totalPages,
  };
}

export interface ItemsByCollection {
  items: DashboardItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// A single page of a collection's items (via the ItemCollection join),
// scoped to the given user, ordered as one combined list across types (most
// recently updated first) — the page groups items by type for rendering, but
// the 21-per-page window applies to the combined list, not per type. `page`
// is 1-indexed and clamped to the valid range. Only fetches the requested
// page, never the full list.
export async function getItemsByCollection(
  collectionId: string,
  userId: string,
  page = 1,
): Promise<ItemsByCollection> {
  const where = { userId, collections: { some: { collectionId } } };
  const totalCount = await prisma.item.count({ where });
  const { currentPage, totalPages } = resolvePage(totalCount, page, ITEMS_PER_PAGE);

  const items = await prisma.item.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: itemInclude,
  });

  return { items: items.map(toDashboardItem), totalCount, currentPage, totalPages };
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
  fileSize: number | null;
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
  fileSize: number | null;
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
    fileSize: item.fileSize,
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

// Full detail for a single item, scoped to the given user. Returns null when
// the item doesn't exist under that user, so the API route can 404.
export async function getItemDetail(
  id: string,
  userId: string,
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    include: itemDetailInclude,
  });
  if (!item) return null;
  return toItemDetail(item);
}

// Narrows client-submitted collection ids down to ones that actually belong to
// the given user, silently dropping the rest rather than erroring.
async function resolveCollectionIds(
  ids: string[],
  userId: string,
): Promise<string[]> {
  if (ids.length === 0) return [];
  const owned = await prisma.collection.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  return owned.map((c) => c.id);
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
  collectionIds: string[];
}

// Update an item and return its fresh ItemDetail (so the drawer can refresh
// without a second fetch), or null when the item isn't found under the given
// user. Tags are replaced wholesale: disconnect all, then connect-or-create by
// unique name. Collection memberships are replaced wholesale too:
// ItemCollection is an explicit join model, so that's a deleteMany + create on
// the join rows rather than set/connectOrCreate.
export async function updateItem(
  id: string,
  data: UpdateItemData,
  userId: string,
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const collectionIds = await resolveCollectionIds(data.collectionIds, userId);

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
      collections: {
        deleteMany: {},
        create: collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    include: itemDetailInclude,
  });
  return toItemDetail(item);
}

export interface DeleteItemResult {
  deleted: boolean;
  // R2 object key of a FILE item's upload, so the calling action can remove
  // the object from storage after the row is gone. Null for TEXT items.
  fileKey: string | null;
}

// Delete an item, scoped to the given user. Returns deleted: false when the
// item isn't found under that user so the action can report not-found.
// ItemCollection join rows drop via onDelete: Cascade and the implicit
// ItemTags join rows are removed by Prisma; shared Tag rows are left intact.
export async function deleteItem(
  id: string,
  userId: string,
): Promise<DeleteItemResult> {
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true, contentType: true, fileUrl: true },
  });
  if (!existing) return { deleted: false, fileKey: null };

  await prisma.item.delete({ where: { id } });
  return {
    deleted: true,
    fileKey: existing.contentType === "FILE" ? existing.fileUrl : null,
  };
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
  collectionIds: string[];
}

// Create an item under the given user and return its ItemDetail, or null when
// `type` isn't a system type. Tags are connect-or-created by unique name;
// collectionIds are validated against the user's own collections and linked
// via the ItemCollection join rows.
export async function createItem(
  data: CreateItemData,
  userId: string,
): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.type, isSystem: true, userId: null },
    select: { id: true },
  });
  if (!itemType) return null;

  const collectionIds = await resolveCollectionIds(data.collectionIds, userId);

  const item = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      contentType: "TEXT",
      userId,
      itemTypeId: itemType.id,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      collections: {
        create: collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    include: itemDetailInclude,
  });
  return toItemDetail(item);
}

// Fields for creating a file/image item. `type` is the system item type name
// ("file" | "image"); `fileUrl` stores the R2 object key (the app serves files
// through the download proxy, so no absolute URL is persisted).
export interface CreateFileItemData {
  type: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  tags: string[];
  collectionIds: string[];
}

// Create a FILE-kind item under the given user and return its ItemDetail, or
// null when `type` isn't a system type.
export async function createFileItem(
  data: CreateFileItemData,
  userId: string,
): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.type, isSystem: true, userId: null },
    select: { id: true },
  });
  if (!itemType) return null;

  const collectionIds = await resolveCollectionIds(data.collectionIds, userId);

  const item = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      contentType: "FILE",
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      userId,
      itemTypeId: itemType.id,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      collections: {
        create: collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    include: itemDetailInclude,
  });
  return toItemDetail(item);
}

export interface ItemFile {
  fileKey: string; // R2 object key (stored in Item.fileUrl)
  fileName: string;
}

// The stored file reference for a FILE item, for the download proxy. Scoped to
// the given user; null when the item doesn't exist, isn't a FILE item, or has
// no stored key.
export async function getItemFile(
  id: string,
  userId: string,
): Promise<ItemFile | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId, contentType: "FILE" },
    select: { fileUrl: true, fileName: true },
  });
  if (!item?.fileUrl) return null;
  return { fileKey: item.fileUrl, fileName: item.fileName ?? "download" };
}

export interface DashboardItemStats {
  items: number;
  favoriteItems: number;
}

// Item totals for the dashboard stats cards.
export async function getItemStats(userId: string): Promise<DashboardItemStats> {
  const [items, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({
      where: { userId, isFavorite: true },
    }),
  ]);
  return { items, favoriteItems };
}
