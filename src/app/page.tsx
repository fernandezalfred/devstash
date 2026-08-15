import { AISection } from "@/components/homepage/AISection";
import { CTASection } from "@/components/homepage/CTASection";
import { Features } from "@/components/homepage/Features";
import { Footer } from "@/components/homepage/Footer";
import { Hero } from "@/components/homepage/Hero";
import { Navbar } from "@/components/homepage/Navbar";
import { Pricing } from "@/components/homepage/Pricing";
import { getCurrentUser } from "@/lib/db/users";

// Render per-request so a signed-in visitor's CTAs correctly point at
// /dashboard instead of /register.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const signedIn = user !== null;
  const ctaHref = signedIn ? "/dashboard" : "/register";

  return (
    <>
      <Navbar signedIn={signedIn} ctaHref={ctaHref} />
      <main>
        <Hero ctaHref={ctaHref} />
        <Features />
        <AISection />
        <Pricing ctaHref={ctaHref} />
        <CTASection ctaHref={ctaHref} />
      </main>
      <Footer />
    </>
  );
}
