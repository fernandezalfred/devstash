"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";

interface ToggleResult {
  success: boolean;
  error?: string;
}

interface UseOptimisticToggleOptions {
  // When set, shown as a success toast after a successful toggle, passed the
  // new value. Favorite toggles pass nothing (no success toast, matching the
  // original pattern); Pin toggles pass one (per its spec).
  successMessage?: (next: boolean) => string;
}

// Generic optimistic boolean toggle shared by the favorite and pin buttons
// across the item drawer, the collection header, and the list-view cards:
// flips local state immediately, persists via `mutate`, rolls back + shows an
// error toast on failure, and refreshes the route on success so any other
// server-rendered surface showing the same item/collection (stats, other
// cards, the sidebar) picks up the change. Resyncs to `initialValue` when it
// changes — a refresh triggered by another instance of this hook (e.g.
// toggling from the drawer while its card is visible behind it) delivers a
// fresh prop here, not a direct state update. Adjusted during render (the
// React-recommended pattern for deriving state from a changed prop) rather
// than in an effect, which would cause an extra commit.
export function useOptimisticToggle(
  initialValue: boolean,
  mutate: () => Promise<ToggleResult>,
  options?: UseOptimisticToggleOptions,
) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [prevInitial, setPrevInitial] = useState(initialValue);

  if (initialValue !== prevInitial) {
    setPrevInitial(initialValue);
    setValue(initialValue);
  }

  async function toggle() {
    if (pending) return;
    const next = !value;
    setValue(next);
    setPending(true);
    const result = await mutate();
    setPending(false);
    if (!result.success) {
      setValue(!next);
      toast(result.error ?? "Could not update.", "error");
      return;
    }
    if (options?.successMessage) {
      toast(options.successMessage(next));
    }
    router.refresh();
  }

  return { value, toggle, pending };
}
