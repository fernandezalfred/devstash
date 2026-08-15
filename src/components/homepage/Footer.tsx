import Link from "next/link";
import { Sparkles } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

// No pages exist yet for these — non-navigating placeholders rather than
// broken links.
const COMPANY_LINKS = ["About", "Blog"];
const LEGAL_LINKS = ["Privacy", "Terms"];

export function Footer() {
  return (
    <footer className="border-t border-border pt-14">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 pb-10 sm:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
          <span className="flex items-center gap-2 text-base font-semibold">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" />
            </span>
            DevStash
          </span>
          <p className="text-sm text-muted-foreground">
            Your developer knowledge hub.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Product
          </h4>
          {PRODUCT_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Company
          </h4>
          {COMPANY_LINKS.map((label) => (
            <span key={label} className="text-sm text-muted-foreground">
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Legal
          </h4>
          {LEGAL_LINKS.map((label) => (
            <span key={label} className="text-sm text-muted-foreground">
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="border-t border-border px-6 py-5 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} DevStash. All rights reserved.
      </div>
    </footer>
  );
}
