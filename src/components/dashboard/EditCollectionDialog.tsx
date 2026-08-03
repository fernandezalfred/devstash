"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30";

// Edits a collection's name/description. Fully controlled (no internal
// trigger) so it can be opened from both the collection detail page header
// and a CollectionCard's dropdown menu.
export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: {
  collection: { id: string; name: string; description: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: collection.name,
    description: collection.description ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Re-sync to the current collection whenever the dialog transitions open,
  // so a previously-cancelled edit doesn't leak into the next open. Adjusted
  // during render (React's recommended alternative to an effect here) rather
  // than in a useEffect, which would trigger a same-tick extra render.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm({
        name: collection.name,
        description: collection.description ?? "",
      });
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && submitting) return;
    onOpenChange(next);
  };

  const set = (key: "name" | "description", value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSave = form.name.trim().length > 0 && !submitting;

  async function handleSave() {
    if (!canSave) return;
    setSubmitting(true);

    let result: { success: boolean; error?: string };
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
        }),
      });
      result = await res.json();
    } catch {
      result = {
        success: false,
        error: "Could not save changes. Please try again.",
      };
    }
    setSubmitting(false);

    if (!result.success) {
      toast(result.error ?? "Could not save changes. Please try again.", "error");
      return;
    }
    handleOpenChange(false);
    router.refresh();
    toast("Collection updated.");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0">
        <DialogTitle>Edit collection</DialogTitle>

        <div className="mt-5 space-y-4">
          <Field label="Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Description">
            <textarea
              className={cn(inputClass, "min-h-16 resize-y")}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
