import { FolderOpen, Heart, Layers, Star } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DashboardStats {
  items: number;
  collections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

// Four summary cards at the top of the dashboard. Not in the reference
// screenshot — added per the phase 3 spec.
export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      label: "Items",
      value: stats.items,
      icon: Layers,
      iconClass: "text-blue-500",
      boxClass: "bg-blue-500/10",
    },
    {
      label: "Collections",
      value: stats.collections,
      icon: FolderOpen,
      iconClass: "text-emerald-500",
      boxClass: "bg-emerald-500/10",
    },
    {
      label: "Favorite Items",
      value: stats.favoriteItems,
      icon: Star,
      iconClass: "fill-amber-400 text-amber-400",
      boxClass: "bg-amber-400/10",
    },
    {
      label: "Favorite Collections",
      value: stats.favoriteCollections,
      icon: Heart,
      iconClass: "fill-rose-500 text-rose-500",
      boxClass: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, iconClass, boxClass }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
        >
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg",
              boxClass,
            )}
          >
            <Icon className={cn("size-5", iconClass)} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
