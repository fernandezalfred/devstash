"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { PrimaryButton } from "@/components/homepage/PrimaryButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar({
  signedIn,
  ctaHref,
}: {
  signedIn: boolean;
  ctaHref: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-transparent backdrop-blur-sm transition-colors duration-300",
        scrolled ? "border-border bg-background/95" : "bg-background/40",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="hidden sm:inline">DevStash</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
          <Link href="#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-foreground">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <PrimaryButton href={ctaHref}>Dashboard</PrimaryButton>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <PrimaryButton href={ctaHref}>Get Started</PrimaryButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
