import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedBySection } from "@/components/landing/TrustedBySection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { DemoSection } from "@/components/landing/DemoSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

// Revalidate every hour for high performance and fast global Edge caching
export const revalidate = 3600;

export default async function LandingPage() {
  const supabase = createClient();

  // ★ DYNAMIC FEATURE FLAGS & SETTINGS: Read runtime switches from DB
  const { data: featureFlags } = await supabase
    .from("feature_flags")
    .select("key, enabled");

  const flagsMap = (featureFlags || []).reduce(
    (acc: Record<string, boolean>, flag: { key: string; enabled: boolean }) => {
      acc[flag.key] = flag.enabled;
      return acc;
    },
    {}
  );

  return (
    <main className="relative min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden">
      {/* Clean Apple-style ambient background — no noise, no heavy blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Very subtle gradient wash */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(0,180,216,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-30 dark:opacity-15"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 80% 100%, rgba(124,58,237,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      <Navbar />
      <HeroSection />
      {flagsMap["trusted_by_section"] !== false && <TrustedBySection />}
      {flagsMap["features_section"] !== false && <FeaturesSection />}
      {flagsMap["how_it_works_section"] !== false && <HowItWorksSection />}
      {flagsMap["demo_section"] !== false && <DemoSection />}
      {flagsMap["testimonials_section"] !== false && <TestimonialsSection />}
      {flagsMap["pricing_section"] !== false && <PricingSection />}
      {flagsMap["faq_section"] !== false && <FAQSection />}
      {flagsMap["cta_section"] !== false && <CTASection />}
      <Footer />
    </main>
  );
}