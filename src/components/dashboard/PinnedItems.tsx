import { Pin } from "lucide-react";

import { type DashboardItem } from "@/lib/db/items";

import { ItemRow } from "./ItemRow";

export function PinnedItems({ items }: { items: DashboardItem[] }) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-1.5">
        <Pin className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Pinned</h2>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
