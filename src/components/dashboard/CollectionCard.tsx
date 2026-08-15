"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Star, Trash2 } from "lucide-react";

import { DeleteCollectionDialog } from "@/components/dashboard/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/dashboard/EditCollectionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOptimisticToggle } from "@/hooks/use-optimistic-toggle";
import { toggleCollectionFavorite } from "@/lib/collections-client";
import { type DashboardCollection } from "@/lib/db/collections";
import { itemTypeIcons } from "@/lib/item-icons";
import { cn } from "@/lib/utils";

// A single collection card. A colored left border reflects the dominant item
// type; the bottom row shows an icon per item type present in the collection.
export function CollectionCard({
  collection,
}: {
  collection: DashboardCollection;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { accentColor, types } = collection;
  const { value: favorite, toggle: toggleFavorite } = useOptimisticToggle(
    collection.isFavorite,
    () => toggleCollectionFavorite(collection.id),
  );

  return (
    // A div instead of a <Link> so the menu trigger button isn't nested inside
    // an anchor (invalid HTML); keyboard access mirrors a link/button.
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/collections/${collection.id}`)}
      onKeyDown={(event) => {
        // Guard against events from nested focusable elements (e.g. the
        // Edit dialog's inputs, which portal to <body> but stay in this
        // React subtree, so a Space keystroke while typing there still
        // bubbles here) — only react when the card itself is the target.
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/collections/${collection.id}`);
        }
      }}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-l-4 border-border bg-card p-4 text-left transition-colors hover:border-foreground/20 focus-visible:border-foreground/20 focus-visible:outline-none"
      style={
        accentColor
          ? {
              borderLeftColor: accentColor,
              backgroundColor: `${accentColor}0d`,
            }
          : undefined
      }
    >
      <h3 className="flex items-center gap-1.5 pr-6 font-medium">
        <span className="truncate">{collection.name}</span>
        {favorite && (
          <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
      </p>
      {collection.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {collection.description}
        </p>
      )}
      {types.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {types.map((type) => {
            const Icon = itemTypeIcons[type.icon];
            return Icon ? (
              <Icon
                key={type.id}
                className="size-4"
                style={{ color: type.color }}
              />
            ) : null;
          })}
        </div>
      )}

      {/* Wrapping this whole cluster in a click-stopper keeps the menu (and
          the modals it opens, which portal to <body> but stay in this React
          subtree) from bubbling clicks up to the card's own navigation. */}
      <div
        className="absolute top-3 right-3"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Collection actions"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:bg-muted data-[state=open]:opacity-100"
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleFavorite()}>
              <Star className={cn(favorite && "fill-yellow-400 text-yellow-400")} />
              {favorite ? "Unfavorite" : "Favorite"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <EditCollectionDialog
          collection={collection}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
        <DeleteCollectionDialog
          collectionId={collection.id}
          collectionName={collection.name}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      </div>
    </div>
  );
}
