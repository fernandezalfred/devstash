"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Copy,
  FolderOpen,
  Loader2,
  Pencil,
  Pin,
  Star,
  Tag,
  Trash2,
} from "lucide-react";

import { updateItem } from "@/actions/items";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { type ItemDetail } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/item-icons";
import { cn } from "@/lib/utils";

// Drawer state lives in this client context so server-rendered cards (ItemCard,
// ItemRow) can open the detail drawer on click without navigating. The provider
// wraps page content in DashboardShell; cards call open(id).
interface ItemDrawerContextValue {
  open: (id: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer(): ItemDrawerContextValue {
  const ctx = useContext(ItemDrawerContext);
  if (!ctx) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return ctx;
}

export function ItemDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Reset fetch state here (an event handler) rather than in the effect, so the
  // effect only ever calls setState from its async callbacks.
  const open = useCallback((id: string) => {
    setItem(null);
    setError(false);
    setLoading(true);
    setOpenId(id);
  }, []);

  useEffect(() => {
    if (!openId) return;

    let cancelled = false;

    fetch(`/api/items/${openId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((body) => {
        if (cancelled) return;
        setItem(body.data as ItemDetail);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [openId]);

  return (
    <ItemDrawerContext.Provider value={{ open }}>
      {children}
      <Sheet
        open={openId !== null}
        onOpenChange={(next) => {
          if (!next) setOpenId(null);
        }}
      >
        <SheetContent aria-describedby={undefined}>
          {loading || (!item && !error) ? (
            <ItemDrawerSkeleton />
          ) : error || !item ? (
            <ItemDrawerError />
          ) : (
            <ItemDrawerBody key={item.id} item={item} onUpdated={setItem} />
          )}
        </SheetContent>
      </Sheet>
    </ItemDrawerContext.Provider>
  );
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ItemDrawerBody({
  item,
  onUpdated,
}: {
  item: ItemDetail;
  onUpdated: (item: ItemDetail) => void;
}) {
  const Icon = itemTypeIcons[item.type.icon];
  const accent = item.type.color;
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ItemEditForm
        item={item}
        onCancel={() => setEditing(false)}
        onSaved={(updated) => {
          onUpdated(updated);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-6 pr-14">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${accent}1a` }}
          >
            {Icon && <Icon className="size-5" style={{ color: accent }} />}
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate">{item.title}</SheetTitle>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {item.type.name}s
              </span>
              {item.language && (
                <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {item.language}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action bar — display only for now; wiring comes in a later pass. */}
        <div className="mt-5 flex items-center gap-1">
          <ActionButton
            icon={Star}
            label="Favorite"
            active={item.isFavorite}
            activeClassName="fill-yellow-400 text-yellow-400"
          />
          <ActionButton
            icon={Pin}
            label="Pin"
            active={item.isPinned}
            activeClassName="text-foreground"
          />
          <ActionButton icon={Copy} label="Copy" />
          <div className="ml-auto flex items-center gap-1">
            <ActionButton
              icon={Pencil}
              label="Edit"
              onClick={() => setEditing(true)}
            />
            <ActionButton
              icon={Trash2}
              label="Delete"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-6 p-6">
        {item.description && (
          <Section label="Description">
            <p className="text-sm">{item.description}</p>
          </Section>
        )}

        {item.contentType === "TEXT" && item.content && (
          <Section label="Content">
            <CodeBlock content={item.content} />
          </Section>
        )}

        {item.url && (
          <Section label="URL">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm break-all text-blue-400 hover:underline"
            >
              {item.url}
            </a>
          </Section>
        )}

        {item.contentType === "FILE" && item.fileName && (
          <Section label="File">
            <p className="text-sm">{item.fileName}</p>
          </Section>
        )}

        {item.tags.length > 0 && (
          <Section label="Tags" icon={Tag}>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {item.collections.length > 0 && (
          <Section label="Collections" icon={FolderOpen}>
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((collection) => (
                <span
                  key={collection.id}
                  className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {collection.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section label="Details" icon={Calendar}>
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatFullDate(item.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{formatFullDate(item.updatedAt)}</dd>
            </div>
          </dl>
        </Section>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active,
  activeClassName,
  className,
  onClick,
}: {
  icon: typeof Star;
  label: string;
  active?: boolean;
  activeClassName?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Icon className={cn("size-4", active && activeClassName)} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Section({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof Tag;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </div>
      {children}
    </section>
  );
}

// Line-numbered code block. Syntax highlighting is intentionally deferred (a
// "later" extra per the spec) — this renders the raw content with a line gutter.
function CodeBlock({ content }: { content: string }) {
  const lines = content.replace(/\n$/, "").split("\n");
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-muted/40">
      <pre className="p-4 text-sm">
        <code className="font-mono">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 inline-block w-6 shrink-0 text-right text-muted-foreground select-none">
                {i + 1}
              </span>
              <span className="whitespace-pre">{line || " "}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="animate-pulse">
      <SheetTitle className="sr-only">Loading item</SheetTitle>
      <div className="border-b border-border p-6 pr-14">
        <div className="flex items-start gap-3">
          <div className="size-10 shrink-0 rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/2 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        </div>
        <div className="mt-5 h-8 w-2/3 rounded bg-muted" />
      </div>
      <div className="space-y-6 p-6">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-32 w-full rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}

function ItemDrawerError() {
  return (
    <div className="p-6 pr-14">
      <SheetTitle>Item unavailable</SheetTitle>
      <p className="mt-2 text-sm text-muted-foreground">
        This item couldn&apos;t be loaded. It may have been deleted.
      </p>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30";

// Inline edit form shown in place of the view body. Controlled local state (no
// form library, per spec); the server action is the validation source of truth.
// Type-specific fields render only for the relevant item type.
function ItemEditForm({
  item,
  onCancel,
  onSaved,
}: {
  item: ItemDetail;
  onCancel: () => void;
  onSaved: (item: ItemDetail) => void;
}) {
  const router = useRouter();
  const Icon = itemTypeIcons[item.type.icon];
  const accent = item.type.color;
  const typeName = item.type.name.toLowerCase();

  const showContent = ["snippet", "prompt", "command", "note"].includes(
    typeName,
  );
  const showLanguage = ["snippet", "command"].includes(typeName);
  const showUrl = typeName === "link";

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [content, setContent] = useState(item.content ?? "");
  const [language, setLanguage] = useState(item.language ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [tagsInput, setTagsInput] = useState(item.tags.join(", "));
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const result = await updateItem(item.id, {
      title,
      description,
      content,
      language,
      url,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setSaving(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    onSaved(result.data);
    // Refresh the underlying server-rendered card lists so they reflect edits.
    router.refresh();
    toast("Item saved.");
  }

  return (
    <div className="flex flex-col">
      {/* Header — type is not editable */}
      <div className="border-b border-border p-6 pr-14">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${accent}1a` }}
          >
            {Icon && <Icon className="size-5" style={{ color: accent }} />}
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle>Edit {typeName}</SheetTitle>
            <div className="mt-2">
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {item.type.name}s
              </span>
            </div>
          </div>
        </div>

        {/* Save / Cancel replace the action bar in edit mode */}
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-5 p-6">
        <Field label="Title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={title.trim().length === 0}
          />
        </Field>

        <Field label="Description">
          <textarea
            className={cn(inputClass, "min-h-20 resize-y")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {showContent && (
          <Field label="Content">
            <textarea
              className={cn(inputClass, "min-h-40 resize-y font-mono")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Field>
        )}

        {showLanguage && (
          <Field label="Language">
            <input
              className={inputClass}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </Field>
        )}

        {showUrl && (
          <Field label="URL">
            <input
              className={inputClass}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
        )}

        <Field label="Tags" hint="Comma-separated">
          <input
            className={inputClass}
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
        {hint && <span className="normal-case">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}
