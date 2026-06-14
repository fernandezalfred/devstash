import { Clock } from "lucide-react";

import { type DashboardItem } from "@/lib/db/items";

import { ItemRow } from "./ItemRow";

export function RecentItems({ items }: { items: DashboardItem[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-1.5">
        <Clock className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recent</h2>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
