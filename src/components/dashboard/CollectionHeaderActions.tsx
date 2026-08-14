"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";

import { DeleteCollectionDialog } from "@/components/dashboard/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/dashboard/EditCollectionDialog";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { toggleCollectionFavorite } from "@/lib/collections-client";
import { cn } from "@/lib/utils";

// Edit / Delete / Favorite actions for the /collections/[id] header. Mirrors
// ItemDrawer's ActionButton bar.
export function CollectionHeaderActions({
  collection,
}: {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { favorite, toggle: toggleFavorite } = useFavoriteToggle(
    collection.isFavorite,
    () => toggleCollectionFavorite(collection.id),
  );

  return (
    <div className="flex items-center gap-1">
      <ActionButton
        icon={Star}
        label="Favorite"
        active={favorite}
        activeClassName="fill-yellow-400 text-yellow-400"
        onClick={() => toggleFavorite()}
      />
      <ActionButton icon={Pencil} label="Edit" onClick={() => setEditOpen(true)} />
      <ActionButton
        icon={Trash2}
        label="Delete"
        onClick={() => setDeleteOpen(true)}
        className="hover:bg-destructive/10 hover:text-destructive"
      />

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
        onDeleted={() => router.push("/collections")}
      />
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
      aria-label={label}
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
