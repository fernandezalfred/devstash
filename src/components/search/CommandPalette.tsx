"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";

import { useItemDrawer } from "@/components/items/ItemDrawer";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { type DashboardCollection } from "@/lib/db/collections";
import { type SearchItem } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/item-icons";

// Global command palette (Cmd+K / Ctrl+K). Mirrors ItemDrawer's
// provider-plus-hook shape: the provider owns open state and the global
// shortcut, renders the dialog alongside children, and exposes `open()` so
// the TopBar's search field can trigger it too. Item results open the item
// drawer (via useItemDrawer, so this must render inside ItemDrawerProvider);
// collection results navigate to the collection page.
interface CommandPaletteContextValue {
  open: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      "useCommandPalette must be used within a CommandPaletteProvider",
    );
  }
  return ctx;
}

export function CommandPaletteProvider({
  children,
  items,
  collections,
}: {
  children: React.ReactNode;
  items: SearchItem[];
  collections: DashboardCollection[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandPaletteDialog
        open={open}
        onOpenChange={setOpen}
        items={items}
        collections={collections}
      />
    </CommandPaletteContext.Provider>
  );
}

function CommandPaletteDialog({
  open,
  onOpenChange,
  items,
  collections,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SearchItem[];
  collections: DashboardCollection[];
}) {
  const router = useRouter();
  const { open: openItem } = useItemDrawer();

  const selectItem = useCallback(
    (id: string) => {
      onOpenChange(false);
      openItem(id);
    },
    [onOpenChange, openItem],
  );

  const selectCollection = useCallback(
    (id: string) => {
      onOpenChange(false);
      router.push(`/collections/${id}`);
    },
    [onOpenChange, router],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search items and collections"
    >
      <Command>
        <CommandInput placeholder="Search items and collections..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {items.length > 0 && (
            <CommandGroup heading="Items">
              {items.map((item) => {
                const Icon = itemTypeIcons[item.typeIcon];
                return (
                  <CommandItem
                    key={item.id}
                    // Filter on the title (+ type as a keyword) only, not the
                    // preview text — a long content preview makes coincidental
                    // fuzzy subsequence matches too likely for short queries
                    // (e.g. "devops" matching scattered letters in an
                    // unrelated snippet's description), burying the real
                    // match under noise. (cmdk keys items by `value`, so two
                    // items sharing an exact title could collide in its
                    // internal selection state — an accepted rare edge case
                    // rather than polluting the match text with an id.)
                    value={item.title}
                    keywords={[item.typeName]}
                    onSelect={() => selectItem(item.id)}
                  >
                    {Icon && (
                      <Icon
                        className="size-4 shrink-0"
                        style={{ color: item.typeColor }}
                      />
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{item.title}</span>
                      {item.preview && (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.preview}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          {collections.length > 0 && (
            <CommandGroup heading="Collections">
              {collections.map((collection) => (
                <CommandItem
                  key={collection.id}
                  value={collection.name}
                  keywords={["collection"]}
                  onSelect={() => selectCollection(collection.id)}
                >
                  <FolderOpen
                    className="size-4 shrink-0"
                    style={{ color: collection.accentColor ?? undefined }}
                  />
                  <span className="truncate">{collection.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {collection.itemCount}{" "}
                    {collection.itemCount === 1 ? "item" : "items"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
