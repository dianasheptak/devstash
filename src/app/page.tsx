import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HomepageNav } from "@/components/homepage/homepage-nav";
import { HeroSection } from "@/components/homepage/hero-section";
import { FeaturesSection } from "@/components/homepage/features-section";
import { AiSection } from "@/components/homepage/ai-section";
import { PricingSection } from "@/components/homepage/pricing-section";
import { CtaSection } from "@/components/homepage/cta-section";
import { HomepageFooter } from "@/components/homepage/homepage-footer";
import { ScrollFadeInit } from "@/components/homepage/scroll-fade-init";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <>
      <HomepageNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AiSection />
        <PricingSection />
        <CtaSection />
      </main>
      <HomepageFooter />
      <ScrollFadeInit />
    </>
  );
}
