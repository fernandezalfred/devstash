"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { PrimaryButton } from "@/components/homepage/PrimaryButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "50 items total",
  "3 collections",
  "All types except files & images",
  "Basic search",
];

const PRO_FEATURES = [
  "Unlimited items & collections",
  "File & image uploads",
  "AI auto-tagging & summaries",
  'AI "Explain this code"',
  "Prompt optimizer",
  "Priority support",
];

// Owns the monthly/yearly toggle state — both the toggle switch and the Pro
// card's price need to share it, so they live in one small client component
// rather than the whole Pricing section being client.
export function PricingCards({ ctaHref }: { ctaHref: string }) {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="mt-9">
      <div className="mb-10 flex items-center justify-center gap-3.5">
        <span className={cn("text-sm", !yearly ? "font-semibold text-foreground" : "text-muted-foreground")}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle yearly billing"
          onClick={() => setYearly((v) => !v)}
          className={cn(
            "relative h-6.5 w-11.5 shrink-0 rounded-full border border-border transition-colors",
            yearly ? "bg-gradient-to-br from-blue-400 to-blue-600" : "bg-card",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
              yearly ? "translate-x-5 bg-white" : "translate-x-0 bg-muted-foreground",
            )}
          />
        </button>
        <span className={cn("text-sm", yearly ? "font-semibold text-foreground" : "text-muted-foreground")}>
          Yearly{" "}
          <span className="ml-1 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[11px] text-green-500">
            save ~25%
          </span>
        </span>
      </div>

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4.5 rounded-xl border border-border bg-card p-8">
          <h3 className="text-lg font-semibold">Free</h3>
          <p className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">$0</span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </p>
          <ul className="flex flex-1 flex-col gap-2.5">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-3.5 shrink-0 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" asChild>
            <Link href={ctaHref}>Get Started</Link>
          </Button>
        </div>

        <div className="relative flex flex-col gap-4.5 rounded-xl border border-blue-500 bg-card p-8 shadow-xl shadow-blue-500/10">
          <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
            Most Popular
          </span>
          <h3 className="text-lg font-semibold">Pro</h3>
          <p className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">{yearly ? "$6" : "$8"}</span>
            <span className="text-sm text-muted-foreground">
              {yearly ? "/mo, billed yearly" : "/mo"}
            </span>
          </p>
          <ul className="flex flex-1 flex-col gap-2.5">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-3.5 shrink-0 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
          <PrimaryButton href={ctaHref} className="w-full">
            Start Free Trial
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
