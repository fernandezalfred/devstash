import { ChevronRight } from "lucide-react";

import { ChaosVisual } from "@/components/homepage/ChaosVisual";
import { HOMEPAGE_ITEM_TYPES } from "@/components/homepage/item-types";
import { cn } from "@/lib/utils";

function Arrow() {
  return (
    // Rotate this wrapper, not the pulsing child — an element's own CSS
    // animation keyframes own its `transform`, so a static rotate() on the
    // same element would be silently clobbered every frame.
    <div className="flex rotate-90 items-center justify-center py-2 md:rotate-0 md:py-0">
      <ChevronRight
        className="size-12 animate-[arrow-pulse_1.8s_ease-in-out_infinite] text-blue-400 md:size-16"
        strokeWidth={2.5}
      />
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="h-80 rounded-xl border border-border bg-card/60 p-5">
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        ...with DevStash
      </p>
      <div className="flex h-60 overflow-hidden rounded-lg border border-border bg-background">
        <div className="w-24 shrink-0 space-y-1 border-r border-border p-2">
          {HOMEPAGE_ITEM_TYPES.map((type, i) => (
            <div
              key={type.name}
              className={cn(
                "flex items-center gap-1.5 truncate rounded px-1.5 py-1 text-[10px] text-muted-foreground",
                i === 0 && "bg-muted text-foreground",
              )}
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              {type.label}
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-2 content-start gap-2 p-2.5">
          {HOMEPAGE_ITEM_TYPES.map((type) => (
            <div
              key={type.name}
              className="h-11 rounded border border-border border-t-[3px] bg-white/[0.03]"
              style={{ borderTopColor: type.color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// The hero's "chaos -> order" visual: scattered tool icons, an arrow, and a
// mock dashboard preview. Only ChaosVisual needs client-side animation; the
// arrow (pure CSS) and dashboard preview (static markup) stay server-rendered.
export function HeroVisual() {
  return (
    <div className="grid w-full grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
      <ChaosVisual />
      <Arrow />
      <DashboardPreview />
    </div>
  );
}
