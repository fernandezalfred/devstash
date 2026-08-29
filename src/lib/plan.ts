import { prisma } from "@/lib/prisma";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;
// System type slugs that require Pro regardless of counts.
export const PRO_ONLY_TYPES = new Set(["file", "image"]);

export type GateResult = { ok: true } | { ok: false; error: string };

// Pure — unit-tested directly in plan.test.ts (src/lib is in the Vitest scope).
export function checkItemQuota(isPro: boolean, currentCount: number): GateResult {
  if (isPro) return { ok: true };
  if (currentCount >= FREE_ITEM_LIMIT) {
    return {
      ok: false,
      error: `Free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited.`,
    };
  }
  return { ok: true };
}

export function checkCollectionQuota(isPro: boolean, currentCount: number): GateResult {
  if (isPro) return { ok: true };
  if (currentCount >= FREE_COLLECTION_LIMIT) {
    return {
      ok: false,
      error: `Free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro.`,
    };
  }
  return { ok: true };
}

export function checkTypeAllowed(isPro: boolean, typeName: string): GateResult {
  if (isPro || !PRO_ONLY_TYPES.has(typeName)) return { ok: true };
  return { ok: false, error: `${typeName} items are a Pro feature. Upgrade to Pro.` };
}

// DB-touching convenience used by the create paths (Phase 2).
export async function getPlanContext(userId: string) {
  const [user, itemCount, collectionCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } }),
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);
  return { isPro: user?.isPro ?? false, itemCount, collectionCount };
}
