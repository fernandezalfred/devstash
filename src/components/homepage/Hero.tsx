import Link from "next/link";

import { GradientText } from "@/components/homepage/GradientText";
import { HeroVisual } from "@/components/homepage/HeroVisual";
import { PrimaryButton } from "@/components/homepage/PrimaryButton";
import { Reveal } from "@/components/homepage/Reveal";
import { Button } from "@/components/ui/button";

export function Hero({ ctaHref }: { ctaHref: string }) {
  return (
    <header className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 pt-40 pb-24 text-center">
      <Reveal className="flex max-w-2xl flex-col items-center gap-5">
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Stop Losing Your <GradientText>Developer Knowledge</GradientText>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Snippets in Notion. Prompts in chat history. Commands in bash
          history. Bring every scrap of your dev knowledge into one fast,
          searchable hub.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <PrimaryButton href={ctaHref} large>
            Get Started Free
          </PrimaryButton>
          <Button variant="outline" size="lg" className="h-11 px-6 text-base" asChild>
            <Link href="#features">See Features</Link>
          </Button>
        </div>
      </Reveal>

      <Reveal className="w-full">
        <HeroVisual />
      </Reveal>
    </header>
  );
}
