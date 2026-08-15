import { PricingCards } from "@/components/homepage/PricingCards";
import { Reveal } from "@/components/homepage/Reveal";
import { Section } from "@/components/homepage/Section";

export function Pricing({ ctaHref }: { ctaHref: string }) {
  return (
    <Section id="pricing">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Simple, honest pricing</h2>
        <p className="mt-3 text-muted-foreground">
          Start free. Upgrade when you need more room.
        </p>
      </Reveal>

      <Reveal>
        <PricingCards ctaHref={ctaHref} />
      </Reveal>
    </Section>
  );
}
