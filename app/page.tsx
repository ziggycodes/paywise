import { LandingNav } from "@/components/marketing/landing-nav";
import { LandingHero } from "@/components/marketing/landing-hero";
import { FeaturesSection } from "@/components/marketing/features-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-pw-bg text-pw-text">
      <LandingNav showDashboard={!!user} />
      <main>
        <LandingHero />
        <FeaturesSection />
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
