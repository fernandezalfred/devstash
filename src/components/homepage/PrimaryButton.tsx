import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The homepage's blue-gradient CTA button (snippet-blue, not the app's
// neutral primary token) — shared by the nav, hero, pricing, and CTA section.
export function PrimaryButton({
  href,
  children,
  className,
  large = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  large?: boolean;
}) {
  return (
    <Button
      asChild
      className={cn(
        "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:opacity-90 hover:shadow-blue-500/40",
        large && "h-11 px-6 text-base",
        className,
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}
