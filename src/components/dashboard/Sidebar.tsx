"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Star } from "lucide-react";

import { UserMenu } from "@/components/dashboard/UserMenu";
import { type DashboardCollection } from "@/lib/db/collections";
import { type SidebarItemType } from "@/lib/db/items";
import { type CurrentUser } from "@/lib/db/users";
import { itemTypeIcons } from "@/lib/item-icons";
import { cn } from "@/lib/utils";

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
      className="flex w-full cursor-pointer items-center gap-1.5 px-2 py-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
    >
      <ChevronDown
        className={cn(
          "size-3.5 shrink-0 transition-transform",
          open ? "rotate-0" : "-rotate-90",
        )}
      />
      <span>{label}</span>
    </button>
  );
}

// Item types gated behind the Pro plan (per the free-tier table in the spec).
const PRO_TYPE_SLUGS = new Set(["files", "images"]);

function ProTag() {
  return (
    <span className="shrink-0 rounded-full bg-yellow-400/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-yellow-400 uppercase">
      Pro
    </span>
  );
}

const navRowClass =
  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground";

export function Sidebar({
  itemTypes,
  collections,
  user,
}: {
  itemTypes: SidebarItemType[];
  collections: DashboardCollection[];
  user: CurrentUser;
}) {
  const [typesOpen, setTypesOpen] = useState(true);
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  const favoriteCollections = collections.filter((c) => c.isFavorite);
  // Non-favorites — favorites are shown in their own section above, so they're
  // excluded here to avoid duplication. Already most-recently-updated first.
  const otherCollections = collections.filter((c) => !c.isFavorite);

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
                  {PRO_TYPE_SLUGS.has(type.slug) ? (
                    <ProTag />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {type.itemCount}
                    </span>
                  )}
                </Link>
              );
            })}
        </div>

        {/* Collections */}
        <div className="space-y-0.5 border-t border-sidebar-border pt-4">
          <SectionHeader
            label="Collections"
            open={collectionsOpen}
            onToggle={() => setCollectionsOpen((o) => !o)}
          />
          {collectionsOpen && (
            <>
              {favoriteCollections.length > 0 && (
                <>
                  <p className="px-2 pt-1.5 pb-0.5 text-sm font-semibold tracking-wider text-muted-foreground/70 lowercase">
                    Favorites
                  </p>
                  {favoriteCollections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.id}`}
                      className={navRowClass}
                    >
                      <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                      <span className="flex-1 truncate">{collection.name}</span>
                    </Link>
                  ))}
                </>
              )}

              <p className="px-2 pt-1.5 pb-0.5 text-sm font-semibold tracking-wider text-muted-foreground/70 lowercase">
                Recents
              </p>
              {otherCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className={navRowClass}
                >
                  {/* Colored dot reflects the collection's dominant item type. */}
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        collection.accentColor ?? "var(--muted-foreground)",
                    }}
                  />
                  <span className="flex-1 truncate">{collection.name}</span>
                </Link>
              ))}

              <Link
                href="/collections"
                className="mt-1 flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              >
                View all collections →
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* User area */}
      <UserMenu
        name={user.name}
        email={user.email}
        image={user.image}
        isPro={user.isPro}
      />
    </aside>
  );
}
