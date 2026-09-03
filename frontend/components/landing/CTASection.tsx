"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CTASection() {
  const [ctaData, setCtaData] = useState({
    badge: "Ready in less than 30 seconds",
    headingLine1: "Ready to create something",
    headingLine2: "beautiful?",
    subheading: "Join 50,000+ founders, creators, and teams making better presentations, faster.",
    primaryBtnText: "Create Your First PPT Free",
    secondaryBtnText: "View Pricing",
    features: [
      "No credit card required",
      "5 free presentations",
      "Export to PPTX & PDF"
    ]
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadCtaConfigFromDB() {
      try {
        // ★ DYNAMIC SETTINGS QUERY: Ingest CTA section configuration & free limits
        const [settingsRes, pricingRes] = await Promise.all([
          supabase
            .from("settings")
            .select("key, value")
            .in("key", [
              "cta_badge_text",
              "cta_heading_line1",
              "cta_heading_line2",
              "cta_subheading",
              "cta_primary_btn",
              "cta_features",
            ]),
          supabase
            .from("pricing")
            .select("limits")
            .eq("plan_name", "free")
            .maybeSingle(),
        ]);

        const settings = settingsRes.data || [];
        const settingsMap: Record<string, string> = {};
        settings.forEach((s) => {
          settingsMap[s.key] = s.value;
        });

        // Determine dynamic free presentation count
        let freePresentationCount = 5;
        if (pricingRes.data?.limits) {
          const limitsObj = pricingRes.data.limits as any;
          if (typeof limitsObj.presentations === "number") {
            freePresentationCount = limitsObj.presentations;
          }
        }

        let parsedFeatures = [
          "No credit card required",
          `${freePresentationCount} free presentations`,
          "Export to PPTX & PDF",
        ];

        if (settingsMap.cta_features) {
          try {
            const json = typeof settingsMap.cta_features === "string" 
              ? JSON.parse(settingsMap.cta_features) 
              : settingsMap.cta_features;
            if (Array.isArray(json) && json.length > 0) parsedFeatures = json;
          } catch (e) {
            console.warn("Could not parse cta_features setting:", e);
          }
        }

        setCtaData((prev) => ({
          ...prev,
          badge: settingsMap.cta_badge_text || prev.badge,
          headingLine1: settingsMap.cta_heading_line1 || prev.headingLine1,
          headingLine2: settingsMap.cta_heading_line2 || prev.headingLine2,
          subheading: settingsMap.cta_subheading || prev.subheading,
          primaryBtnText: settingsMap.cta_primary_btn || prev.primaryBtnText,
          features: parsedFeatures,
        }));
      } catch (err) {
        console.warn("Error loading dynamic CTA settings:", err);
      }
    }

    loadCtaConfigFromDB();
  }, [supabase]);

  return (
    <section className="relative py-24 md:py-32 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2.5rem] overflow-hidden p-12 md:p-20 text-center"
          style={{
            background: "linear-gradient(135deg, #FF3B8B 0%, #7C3AED 35%, #0077B6 70%, #00B4D8 100%)",
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/10 blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-white mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{ctaData.badge}</span>
            </div>

            <h2 className="hero-heading text-4xl md:text-6xl text-white mb-6">
              {ctaData.headingLine1}
              <br />
              {ctaData.headingLine2}
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-xl mx-auto font-light">
              {ctaData.subheading}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium bg-white text-slate-900 hover:scale-105 transition-transform group shadow-lg"
              >
                {ctaData.primaryBtnText}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full font-medium bg-white/10 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
              >
                {ctaData.secondaryBtnText}
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
              {ctaData.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}