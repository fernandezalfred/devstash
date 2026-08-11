import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

// A native <select>, styled to match Input — this repo deliberately avoids
// adding a UI-kit Select primitive for simple dropdowns (see CollectionsPicker).
//
// The closed box can get away with a transparent/card background because
// it's rendered inline, but the open option list is a native OS popup that
// doesn't inherit the page's background — without an explicit color it
// falls back to the browser default (white bg, and since our text is styled
// light-on-dark, near-invisible text until a hover/selection highlight
// happens to supply contrast). bg-popover/text-popover-foreground is set on
// both the select and every option so the popup renders themed.
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-8 w-full appearance-none rounded-lg border border-input bg-popover px-2.5 pr-8 text-base text-popover-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&_option]:bg-popover [&_option]:text-popover-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { Select };
