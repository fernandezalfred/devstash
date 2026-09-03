import { cn } from "@/lib/utils";

export function PlanBadge({
  isPro,
  size = "sm",
}: {
  isPro: boolean;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full font-semibold tracking-wide uppercase",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        isPro
          ? "bg-yellow-400/15 text-yellow-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {isPro ? "Pro" : "Free"}
    </span>
  );
}
