"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30";

function emptyForm() {
  return { name: "", description: "" };
}

// "New Collection" modal, mirroring CreateItemDialog's shape (controlled local
// form state, Create disabled until required fields are filled, toast +
// router.refresh() on success). Unlike item create, this posts to a new API
// route rather than a Server Action — see the Collection Create feature notes.
export function CreateCollectionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next && submitting) return;
    setOpen(next);
    if (!next) setForm(emptyForm());
  };

  const set = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: string,
  ) => setForm((f) => ({ ...f, [key]: value }));

  const canCreate = form.name.trim().length > 0 && !submitting;

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);

    let result: { success: boolean; error?: string };
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
        }),
      });
      result = await res.json();
    } catch {
      result = { success: false, error: "Could not create collection. Please try again." };
    }
    setSubmitting(false);

    if (!result.success) {
      toast(result.error ?? "Could not create collection. Please try again.", "error");
      return;
    }
    handleOpenChange(false);
    router.refresh();
    toast("Collection created.");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="New Collection">
          <FolderPlus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">New Collection</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0">
        <DialogTitle>New collection</DialogTitle>

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
          <Button onClick={handleCreate} disabled={!canCreate}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Create
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
