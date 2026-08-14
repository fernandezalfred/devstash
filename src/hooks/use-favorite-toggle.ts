"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";

interface ToggleResult {
  success: boolean;
  error?: string;
}

// Optimistic favorite toggle shared by the item drawer, the collection
// header, and the list-view cards: flips local state immediately, persists
// via `mutate`, rolls back + shows an error toast on failure, and refreshes
// the route on success so any other server-rendered surface showing the same
// item/collection (stats, other cards, the sidebar) picks up the change.
// Resyncs to `initialFavorite` when it changes — a refresh triggered by
// another instance of this hook (e.g. toggling from the drawer while its card
// is visible behind it) delivers a fresh prop here, not a direct state
// update. Adjusted during render (the React-recommended pattern for deriving
// state from a changed prop) rather than in an effect, which would cause an
// extra commit.
export function useFavoriteToggle(
  initialFavorite: boolean,
  mutate: () => Promise<ToggleResult>,
) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);
  const [prevInitial, setPrevInitial] = useState(initialFavorite);

  if (initialFavorite !== prevInitial) {
    setPrevInitial(initialFavorite);
    setFavorite(initialFavorite);
  }

  async function toggle() {
    if (pending) return;
    const next = !favorite;
    setFavorite(next);
    setPending(true);
    const result = await mutate();
    setPending(false);
    if (!result.success) {
      setFavorite(!next);
      toast(result.error ?? "Could not update favorite.", "error");
      return;
    }
    router.refresh();
  }

  return { favorite, toggle, pending };
}
