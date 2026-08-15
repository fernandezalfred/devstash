"use client";

// Client-side helper for PATCH /api/collections/[id]/favorite, shared by
// CollectionHeaderActions and CollectionCard (both drive the same
// useOptimisticToggle hook against this endpoint).
export async function toggleCollectionFavorite(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/collections/${id}/favorite`, {
      method: "PATCH",
    });
    return await res.json();
  } catch {
    return {
      success: false,
      error: "Could not update favorite. Please try again.",
    };
  }
}
