// Shared pagination constants and helpers. Page sizes are DB-level `take`
// limits (see src/lib/db/*), never a fetch-all-then-slice in memory.

export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

// Parses a page number out of a Next.js searchParams value. Anything
// missing, non-numeric, or less than 1 falls back to page 1 rather than
// erroring — an out-of-range page is clamped separately once the caller
// knows the real page count.
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export interface PageInfo {
  currentPage: number;
  totalPages: number;
}

// Given a total row count and the requested page, returns the total page
// count and a currentPage clamped into [1, totalPages] so an out-of-range
// `?page=` (or a page that no longer exists because rows were deleted) never
// produces an empty page — callers use the clamped page for their `skip`.
export function resolvePage(totalCount: number, requestedPage: number, perPage: number): PageInfo {
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  return { currentPage, totalPages };
}
