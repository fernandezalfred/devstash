"use client";

import Link from "next/link";
import { FolderOpen, PanelLeft, Search, Star } from "lucide-react";

import { CreateCollectionDialog } from "@/components/dashboard/CreateCollectionDialog";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { useCommandPalette } from "@/components/search/CommandPalette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type CollectionOption } from "@/lib/db/collections";
import { type SidebarItemType } from "@/lib/db/items";

// Top bar: brand, sidebar toggle, search field, and action buttons. The
// search field opens the global command palette (Cmd+K/Ctrl+K) rather than
// filtering inline — it's `readOnly` so a click/focus opens the palette
// instead of allowing typing directly into the field. The sidebar toggle is
// wired to the dashboard shell, and New Collection / New Item open their
// create modals.
export function TopBar({
  onToggleSidebar,
  itemTypes = [],
  collectionOptions = [],
  isPro = false,
}: {
  onToggleSidebar?: () => void;
  itemTypes?: SidebarItemType[];
  collectionOptions?: CollectionOption[];
  isPro?: boolean;
}) {
  const { open: openPalette } = useCommandPalette();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <div className="flex items-center gap-1.5 font-semibold">
        <Link href="/dashboard" aria-label="DevStash" className="flex items-center gap-1.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FolderOpen className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden text-sm sm:inline">DevStash</span>
        </Link>
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
          type="text"
          placeholder="Search items and collections..."
          aria-label="Search items and collections"
          className="h-9 cursor-pointer pl-8 pr-12"
          readOnly
          onClick={openPalette}
          onFocus={openPalette}
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Favorites" asChild>
          <Link href="/favorites">
            <Star className="size-4" />
          </Link>
        </Button>
        <CreateCollectionDialog />
        <CreateItemDialog
          types={itemTypes}
          collections={collectionOptions}
          isPro={isPro}
        />
      </div>
    </header>
  );
}
