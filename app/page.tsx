import { LandingNav } from "@/components/marketing/landing-nav";
import { LandingHero } from "@/components/marketing/landing-hero";
import { FeaturesSection } from "@/components/marketing/features-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { LandingFooter } from "@/components/marketing/landing-footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-pw-bg text-pw-text">
      <LandingNav />
      <main>
        <LandingHero />
        <FeaturesSection />
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
