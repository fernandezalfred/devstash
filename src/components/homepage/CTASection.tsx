import { PrimaryButton } from "@/components/homepage/PrimaryButton";
import { Reveal } from "@/components/homepage/Reveal";
import { Section } from "@/components/homepage/Section";

export function CTASection({ ctaHref }: { ctaHref: string }) {
  return (
    <Section className="text-center">
      <Reveal className="mx-auto flex max-w-lg flex-col items-center gap-4.5">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          Ready to Organize Your Knowledge?
        </h2>
        <p className="text-muted-foreground">
          Join developers who stopped losing their best code, prompts, and
          commands.
        </p>
        <PrimaryButton href={ctaHref} large>
          Get Started Free
        </PrimaryButton>
      </Reveal>
    </Section>
  );
}
