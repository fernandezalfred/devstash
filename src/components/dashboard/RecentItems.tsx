import { Clock } from "lucide-react";

import { recentItems } from "@/lib/dashboard";

import { ItemRow } from "./ItemRow";

export function RecentItems() {
  return (
    <section>
      <div className="mb-3 flex items-center gap-1.5">
        <Clock className="size-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Recent</h2>
      </div>
      <div className="space-y-2">
        {recentItems.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
