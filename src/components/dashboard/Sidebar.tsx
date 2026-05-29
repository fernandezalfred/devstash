"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Settings, Star } from "lucide-react";

import { collections, currentUser, itemTypes } from "@/lib/mock-data";
import { itemTypeIcons } from "@/lib/item-icons";
import { cn } from "@/lib/utils";

const favoriteCollections = collections.filter((c) => c.isFavorite);
// Non-favorite collections, most recently updated first. Favorites are shown in
// their own section above, so they're excluded here to avoid duplication.
const otherCollections = collections
  .filter((c) => !c.isFavorite)
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

const userInitials = currentUser.name
  .split(" ")
  .map((part) => part[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <span>{label}</span>
      <ChevronDown
        className={cn(
          "size-3.5 transition-transform",
          open ? "rotate-0" : "-rotate-90"
        )}
      />
    </button>
  );
}

const navRowClass =
  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground";

export function Sidebar() {
  const [typesOpen, setTypesOpen] = useState(true);
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {/* Types */}
        <div className="space-y-0.5">
          <SectionHeader
            label="Types"
            open={typesOpen}
            onToggle={() => setTypesOpen((o) => !o)}
          />
          {typesOpen &&
            itemTypes.map((type) => {
              const Icon = itemTypeIcons[type.icon];
              return (
                <Link
                  key={type.id}
                  href={`/items/${type.slug}`}
                  className={navRowClass}
                >
                  {Icon && (
                    <Icon className="size-4" style={{ color: type.color }} />
                  )}
                  <span className="flex-1 truncate">{type.name}s</span>
                  <span className="text-xs text-muted-foreground">
                    {type.itemCount}
                  </span>
                </Link>
              );
            })}
        </div>

        {/* Collections */}
        <div className="space-y-0.5">
          <SectionHeader
            label="Collections"
            open={collectionsOpen}
            onToggle={() => setCollectionsOpen((o) => !o)}
          />
          {collectionsOpen && (
            <>
              {favoriteCollections.length > 0 && (
                <>
                  <p className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                    Favorites
                  </p>
                  {favoriteCollections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.id}`}
                      className={navRowClass}
                    >
                      <span className="flex-1 truncate">{collection.name}</span>
                      <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                    </Link>
                  ))}
                </>
              )}

              <p className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                All Collections
              </p>
              {otherCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className={navRowClass}
                >
                  <span className="flex-1 truncate">{collection.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {collection.itemCount}
                  </span>
                </Link>
              ))}
            </>
          )}
        </div>
      </nav>

      {/* User area */}
      <div className="flex items-center gap-2.5 border-t border-sidebar-border p-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-medium text-sidebar-primary-foreground">
          {userInitials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {currentUser.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {currentUser.email}
          </p>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </aside>
  );
}
