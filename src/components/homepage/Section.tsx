import { cn } from "@/lib/utils";

// Shared section shell for the homepage — a bordered, padded, max-width band.
// Hero doesn't use this (different padding, no top border).
export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("border-t border-border py-24", className)}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}
