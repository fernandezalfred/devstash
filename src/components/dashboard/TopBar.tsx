"use client";

import { FolderPlus, PanelLeft, Search, Sparkles } from "lucide-react";

import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type SidebarItemType } from "@/lib/db/items";

// Slugs of the upload-only Pro types, excluded from the "New Item" type picker.
const NON_CREATABLE_SLUGS = new Set(["files", "images"]);

// Top bar: brand, sidebar toggle, search field, and action buttons. Search and
// New Collection stay display-only until later phases; the sidebar toggle is
// wired to the dashboard shell and New Item opens the create modal.
export function TopBar({
  onToggleSidebar,
  itemTypes = [],
}: {
  onToggleSidebar?: () => void;
  itemTypes?: SidebarItemType[];
}) {
  const creatableTypes = itemTypes.filter(
    (type) => !NON_CREATABLE_SLUGS.has(type.slug),
  );
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <div className="flex items-center gap-1.5 font-semibold">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <span className="hidden text-sm sm:inline">DevStash</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="ml-1"
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          aria-label="Search items"
          className="h-9 pl-8 pr-12"
          disabled
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <FolderPlus className="size-4" />
          <span className="hidden sm:inline">New Collection</span>
        </Button>
        <CreateItemDialog types={creatableTypes} />
      </div>
    </header>
  );
}
