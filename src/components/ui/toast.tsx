"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastItem = { id: number; message: string };

// Module-level pub/sub so toast() can be called from anywhere and the single
// <Toaster> in the root layout renders it. The Toaster persists across client
// navigations, so a toast fired right before router.push() shows on the next page.
let counter = 0;
const listeners = new Set<(t: ToastItem) => void>();
const DURATION_MS = 5000;

export function toast(message: string) {
  const item: ToastItem = { id: ++counter, message };
  listeners.forEach((listener) => listener(item));
  return item.id;
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const add = (t: ToastItem) => {
      setItems((prev) => [...prev, t]);
      setTimeout(
        () => setItems((prev) => prev.filter((i) => i.id !== t.id)),
        DURATION_MS,
      );
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  const dismiss = (id: number) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-[100] flex flex-col gap-2 empty:hidden"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-2.5 rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg",
            "animate-in slide-in-from-bottom-2 fade-in",
          )}
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
