"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles, Layers, Palette, Download, Wand2, Shield, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DemoFeature {
  iconName?: string;
  label: string;
  color: string;
}

const ICON_MAP: Record<string, any> = {
  Sparkles,
  Layers,
  Palette,
  Download,
  Wand2,
  Shield,
  Zap,
};

const DEFAULT_DEMO_FEATURES: DemoFeature[] = [
  { iconName: "Sparkles", label: "AI Generation", color: "from-pink-500 to-rose-500" },
  { iconName: "Layers", label: "Smart Layouts", color: "from-cyan-500 to-blue-600" },
  { iconName: "Palette", label: "10+ Themes", color: "from-purple-500 to-indigo-600" },
  { iconName: "Download", label: "PPTX Export", color: "from-emerald-500 to-teal-600" },
];

export function DemoSection() {
  const [demoFeatures, setDemoFeatures] = useState<DemoFeature[]>(DEFAULT_DEMO_FEATURES);
  const [demoMeta, setDemoMeta] = useState({
    badge: "See it in action",
    headingLine1: "Watch the magic",
    headingLine2: "happen live.",
    subheading: "See how easy it is to go from prompt to polished presentation.",
    durationText: "2:34 min demo",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadDemoConfig() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", [
            "demo_badge",
            "demo_heading_line1",
            "demo_heading_line2",
            "demo_subheading",
            "demo_duration_text",
            "demo_features",
          ]);

        if (settings && settings.length > 0) {
          const map: Record<string, string> = {};
          settings.forEach((s) => {
            map[s.key] = s.value;
          });

          setDemoMeta((prev) => ({
            badge: map.demo_badge || prev.badge,
            headingLine1: map.demo_heading_line1 || prev.headingLine1,
            headingLine2: map.demo_heading_line2 || prev.headingLine2,
            subheading: map.demo_subheading || prev.subheading,
            durationText: map.demo_duration_text || prev.durationText,
          }));

          if (map.demo_features) {
            try {
              const parsed = typeof map.demo_features === "string" ? JSON.parse(map.demo_features) : map.demo_features;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setDemoFeatures(parsed);
              }
            } catch (e) {
              console.warn("Could not parse demo_features JSON:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Error retrieving dynamic demo settings:", err);
      }
    }

    loadDemoConfig();
  }, [supabase]);

  return (
    <section id="demo" className="relative py-24 md:py-32 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="orb orb-cyan w-[500px] h-[500px] top-1/2 -left-40 opacity-30" />
      <div className="orb orb-pink w-[400px] h-[400px] bottom-0 -right-20 opacity-30" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="pill-badge mb-6">
            <span>{demoMeta.badge}</span>
          </div>
          <h2 className="hero-heading text-4xl md:text-6xl text-slate-900 dark:text-white mb-6">
            {demoMeta.headingLine1}
            <br />
            <span className="gradient-text">{demoMeta.headingLine2}</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
            {demoMeta.subheading}
          </p>
        </motion.div>

        {/* Demo video mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-[3rem] blur-3xl" />

          <div className="product-frame relative bg-slate-900">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-6 py-4 bg-slate-800 border-b border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
            </div>

            {/* Video area */}
            <div className="relative aspect-video bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center group cursor-pointer">
              {/* Play button */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                <button className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-slate-900 ml-1" fill="currentColor" />
                </button>
              </div>

              {/* Background slide preview */}
              <div className="absolute inset-8 md:inset-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-700/20 border border-white/10 opacity-40" />

              <div className="absolute bottom-6 left-6 text-white/60 text-sm">{demoMeta.durationText}</div>
            </div>
          </div>

          {/* Feature callouts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {demoFeatures.map((f, i) => {
              const IconComponent = f.iconName ? ICON_MAP[f.iconName] || Sparkles : Sparkles;
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="apple-card p-4 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{f.label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}