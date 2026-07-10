"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { createItem } from "@/actions/items";
import {
  CodeEditor,
  codeFallbackLanguage,
  isCodeEditorType,
} from "@/components/items/CodeEditor";
import {
  isMarkdownEditorType,
  MarkdownEditor,
} from "@/components/items/MarkdownEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { type SidebarItemType } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/item-icons";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30";

// The empty form state, keyed off the default (first) type.
function emptyForm(type: string) {
  return {
    type,
    title: "",
    description: "",
    content: "",
    language: "",
    url: "",
    tags: "",
  };
}

// "New Item" modal. Fields are gated by the selected type (mirrors the drawer
// edit form); submit runs the createItem server action, then closes + refreshes
// so the item appears in the lists. `initialType` preselects a type in the
// picker (e.g. from a type page); `triggerLabel` customizes the trigger button.
export function CreateItemDialog({
  types,
  initialType,
  triggerLabel = "New Item",
}: {
  types: SidebarItemType[];
  initialType?: string;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const creatableValues = types.map((type) => type.name.toLowerCase());
  const startType =
    initialType && creatableValues.includes(initialType)
      ? initialType
      : (creatableValues[0] ?? "snippet");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => emptyForm(startType));
  const [submitting, setSubmitting] = useState(false);

  // Single close/open path so the form also resets when we close programmatically
  // (Cancel, successful create) — Radix only calls onOpenChange for its own
  // triggers (Esc, overlay, X), not for direct state updates.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setForm(emptyForm(startType));
  };

  const set = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: string,
  ) => setForm((f) => ({ ...f, [key]: value }));

  const showContent = ["snippet", "prompt", "command", "note"].includes(
    form.type,
  );
  const showLanguage = ["snippet", "command"].includes(form.type);
  const showUrl = form.type === "link";

  const canCreate =
    form.title.trim().length > 0 &&
    (!showUrl || form.url.trim().length > 0) &&
    !submitting;

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    const result = await createItem({
      type: form.type as never,
      title: form.title,
      description: form.description,
      content: form.content,
      language: form.language,
      url: form.url,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setSubmitting(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    handleOpenChange(false);
    router.refresh();
    toast("Item created.");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0">
        <DialogTitle>New item</DialogTitle>

        {/* Type selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {types.map((type) => {
            const value = type.name.toLowerCase();
            const Icon = itemTypeIcons[type.icon];
            const selected = form.type === value;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => set("type", value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                  selected
                    ? "border-foreground/30 bg-muted"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {Icon && (
                  <Icon className="size-4" style={{ color: type.color }} />
                )}
                {type.name}
              </button>
            );
          })}
        </div>

        {/* Fields */}
        <div className="mt-5 space-y-4">
          <Field label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
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

          {showContent && (
            <Field
              label="Content"
              plain={
                isCodeEditorType(form.type) || isMarkdownEditorType(form.type)
              }
            >
              {isCodeEditorType(form.type) ? (
                <CodeEditor
                  value={form.content}
                  onChange={(v) => set("content", v)}
                  language={form.language}
                  fallbackLanguage={codeFallbackLanguage(form.type)}
                />
              ) : isMarkdownEditorType(form.type) ? (
                <MarkdownEditor
                  value={form.content}
                  onChange={(v) => set("content", v)}
                />
              ) : (
                <textarea
                  className={cn(inputClass, "min-h-32 resize-y font-mono")}
                  value={form.content}
                  onChange={(e) => set("content", e.target.value)}
                />
              )}
            </Field>
          )}

          {showLanguage && (
            <Field label="Language">
              <input
                className={inputClass}
                value={form.language}
                onChange={(e) => set("language", e.target.value)}
              />
            </Field>
          )}

          {showUrl && (
            <Field label="URL">
              <input
                className={inputClass}
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
              />
            </Field>
          )}

          <Field label="Tags" hint="Comma-separated">
            <input
              className={inputClass}
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
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
  hint,
  plain,
  children,
}: {
  label: string;
  hint?: string;
  /**
   * Render as a <div> instead of a <label>. Required when the field hosts a
   * composite editor with its own buttons: clicking anywhere non-interactive
   * inside a <label> dispatches a click on its first button (e.g. Copy).
   */
  plain?: boolean;
  children: React.ReactNode;
}) {
  const Wrapper = plain ? "div" : "label";
  return (
    <Wrapper className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
        {hint && <span className="normal-case">· {hint}</span>}
      </span>
      {children}
    </Wrapper>
  );
}
