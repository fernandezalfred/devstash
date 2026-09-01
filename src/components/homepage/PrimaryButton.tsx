import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The homepage's blue-gradient CTA button (snippet-blue, not the app's
// neutral primary token) — shared by the nav, hero, pricing, and CTA section.
// Either `href` (renders a Link, the common case) or `onClick` (renders a
// plain button — e.g. a signed-in Pricing CTA that triggers Checkout instead
// of navigating) must be given.
type PrimaryButtonProps = {
  children: React.ReactNode;
  className?: string;
  large?: boolean;
} & (
  | { href: string; onClick?: never; disabled?: never }
  | { href?: never; onClick: () => void; disabled?: boolean }
);

export function PrimaryButton({
  href,
  onClick,
  disabled,
  children,
  className,
  large = false,
}: PrimaryButtonProps) {
  const buttonClassName = cn(
    "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:opacity-90 hover:shadow-blue-500/40",
    large && "h-11 px-6 text-base",
    className,
  );

  if (href) {
    return (
      <Button asChild className={buttonClassName}>
        <Link href={href}>{children}</Link>
      </Button>
    );
  }

  return (
    <Button className={buttonClassName} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}
