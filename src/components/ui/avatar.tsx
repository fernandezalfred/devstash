"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// Derive up-to-two-letter initials from a name, e.g. "Brad Traversy" → "BT".
export function getInitials(name?: string | null) {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Reusable avatar: renders the user's image when present, otherwise falls back
// to initials. Radix swaps to the fallback automatically if the image fails.
export function Avatar({
  name,
  image,
  className,
}: {
  name?: string | null;
  image?: string | null;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full bg-sidebar-primary",
        className,
      )}
    >
      {image && (
        <AvatarPrimitive.Image
          src={image}
          alt={name ?? "User"}
          className="size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        delayMs={image ? 300 : 0}
        className="flex size-full items-center justify-center text-xs font-medium text-sidebar-primary-foreground"
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
