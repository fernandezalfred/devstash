"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

// Confirms and performs a collection delete. Fully controlled (no internal
// trigger) so it can be opened from both the collection detail page header
// and a CollectionCard's dropdown menu. Deleting a collection never deletes
// its items — only the ItemCollection join rows go with it (see
// deleteCollection in src/lib/db/collections.ts) — so the copy here is
// explicit about that.
export function DeleteCollectionDialog({
  collectionId,
  collectionName,
  open,
  onOpenChange,
  onDeleted,
}: {
  collectionId: string;
  collectionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called after a successful delete instead of the default router.refresh()
  // — the detail page passes a redirect to /collections since the page it's
  // on no longer exists.
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next && deleting) return;
    onOpenChange(next);
  };

  async function handleDelete() {
    setDeleting(true);

    let result: { success: boolean; error?: string };
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });
      result = await res.json();
    } catch {
      result = {
        success: false,
        error: "Could not delete collection. Please try again.",
      };
    }
    setDeleting(false);

    if (!result.success) {
      toast(result.error ?? "Could not delete collection. Please try again.", "error");
      return;
    }
    onOpenChange(false);
    toast("Collection deleted.");
    // onDeleted (when passed) navigates away first, then refresh — refreshing
    // before the navigation only busts the Router Cache for the page being
    // left, not the destination, so the sidebar's collections list (fetched
    // by the shared layout) would still show the stale entry.
    onDeleted?.();
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete &ldquo;{collectionName}&rdquo;?</AlertDialogTitle>
        <AlertDialogDescription className="mt-2">
          This deletes the collection. Its items are not deleted — they&apos;ll
          just no longer belong to this collection. This action cannot be
          undone.
        </AlertDialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={deleting}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
