"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wand2, ImageIcon, BarChart3, Palette, FileUp, Globe,
  Zap, Layers, Sparkles, Shield, Clock, Users
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HeroFeature {
  iconName: string;
  tag: string;
  title: string;
  description: string;
  span: string;
  color: string;
  bg: string;
  darkBg: string;
  visual: string;
}

interface MicroFeature {
  iconName: string;
  title: string;
  desc: string;
  color: string;
  bg: string;
}

const ICON_MAP: Record<string, any> = {
  Wand2,
  ImageIcon,
  BarChart3,
  Palette,
  FileUp,
  Globe,
  Zap,
  Layers,
  Sparkles,
  Shield,
  Clock,
  Users,
};

const DEFAULT_HERO_FEATURES: HeroFeature[] = [
  {
    iconName: "Wand2",
    tag: "AI Engine",
    title: "One prompt.\nComplete deck.",
    description: "Describe your idea. Our multi-model AI engine crafts a structured presentation with diverse layouts, punchy copy, and speaker notes in under 30 seconds.",
    span: "md:col-span-2 md:row-span-2",
    color: "from-pink-500 to-rose-500",
    bg: "from-pink-50 to-rose-50",
    darkBg: "dark:from-pink-950/20 dark:to-rose-950/20",
    visual: "hero",
  },
  {
    iconName: "FileUp",
    tag: "Import",
    title: "PDFs, Docs, Notes.",
    description: "Drop any file. Extract the essence. Restructured into slides instantly.",
    span: "md:col-span-1",
    color: "from-cyan-500 to-blue-600",
    bg: "from-cyan-50 to-blue-50",
    darkBg: "dark:from-cyan-950/20 dark:to-blue-950/20",
    visual: "upload",
  },
  {
    iconName: "ImageIcon",
    tag: "Visuals",
    title: "Every image, generated.",
    description: "AI images, stock photos, icons, and charts — placed with perfect composition.",
    span: "md:col-span-1",
    color: "from-purple-500 to-indigo-600",
    bg: "from-purple-50 to-indigo-50",
    darkBg: "dark:from-purple-950/20 dark:to-indigo-950/20",
    visual: "images",
  },
  {
    iconName: "Palette",
    tag: "Design",
    title: "20+ crafted themes",
    description: "Ocean Breeze, Midnight Nova, Neon Pulse — each pixel-perfect.",
    span: "md:col-span-1",
    color: "from-orange-500 to-red-500",
    bg: "from-orange-50 to-red-50",
    darkBg: "dark:from-orange-950/20 dark:to-red-950/20",
    visual: "themes",
  },
  {
    iconName: "Layers",
    tag: "Editor",
    title: "Full creative control",
    description: "Drag. Resize. Edit. Swap. A canvas editor that respects your craft.",
    span: "md:col-span-2",
    color: "from-emerald-500 to-teal-600",
    bg: "from-emerald-50 to-teal-50",
    darkBg: "dark:from-emerald-950/20 dark:to-teal-950/20",
    visual: "editor",
  },
];

const DEFAULT_MICRO_FEATURES: MicroFeature[] = [
  { iconName: "Globe", title: "10+ Languages", desc: "Native multilingual", color: "text-blue-500", bg: "bg-blue-500/10" },
  { iconName: "Zap", title: "Sub-30s Speed", desc: "Prompt to deck", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { iconName: "Sparkles", title: "7 Art Styles", desc: "Corporate to neon", color: "text-pink-500", bg: "bg-pink-500/10" },
  { iconName: "Users", title: "Team Sync", desc: "Real-time collab", color: "text-purple-500", bg: "bg-purple-500/10" },
  { iconName: "Clock", title: "Version History", desc: "Never lose changes", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { iconName: "Shield", title: "SOC 2 Ready", desc: "Enterprise security", color: "text-green-500", bg: "bg-green-500/10" },
  { iconName: "BarChart3", title: "Smart Charts", desc: "Data to visuals", color: "text-orange-500", bg: "bg-orange-500/10" },
  { iconName: "FileUp", title: "Export Free", desc: "PPTX, PDF, PNG", color: "text-indigo-500", bg: "bg-indigo-500/10" },
];

function BentoVisual({ type }: { type: string }) {
  if (type === "hero") {
    return (
      <div className="relative mt-8 mx-auto max-w-md">
        <div className="aspect-video rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-500 p-8 shadow-2xl shadow-pink-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative">
            <div className="h-3 w-3/4 rounded-full bg-white/40 mb-2.5" />
            <div className="h-2 w-1/2 rounded-full bg-white/25 mb-6" />
            <div className="space-y-2">
              <div className="h-1.5 w-full rounded-full bg-white/20" />
              <div className="h-1.5 w-5/6 rounded-full bg-white/15" />
              <div className="h-1.5 w-4/5 rounded-full bg-white/15" />
            </div>
          </div>
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1">
            <Sparkles className="h-2.5 w-2.5 text-white" />
            <span className="text-[9px] font-bold text-white">AI</span>
          </div>
        </div>
      </div>
    );
  }
  if (type === "upload") {
    return (
      <div className="mt-6 relative">
        <div className="rounded-xl border-2 border-dashed border-cyan-500/30 p-6 bg-cyan-50/50 dark:bg-cyan-950/20">
          <FileUp className="h-8 w-8 text-cyan-500 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-[10px] text-center text-slate-500 font-medium">Drop file here</p>
        </div>
      </div>
    );
  }
  if (type === "images") {
    return (
      <div className="mt-6 grid grid-cols-3 gap-1.5">
        <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-400 to-pink-400" />
        <div className="aspect-square rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500" />
        <div className="aspect-square rounded-lg bg-gradient-to-br from-orange-400 to-red-400" />
      </div>
    );
  }
  if (type === "themes") {
    return (
      <div className="mt-6 flex gap-1.5">
        <div className="h-8 flex-1 rounded-md bg-gradient-to-br from-slate-900 to-blue-800" />
        <div className="h-8 flex-1 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600" />
        <div className="h-8 flex-1 rounded-md bg-gradient-to-br from-pink-500 to-purple-600" />
        <div className="h-8 flex-1 rounded-md bg-gradient-to-br from-green-400 to-emerald-500" />
      </div>
    );
  }
  if (type === "editor") {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 p-3">
        <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <div className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <div className="aspect-video rounded bg-gradient-to-br from-cyan-200 to-blue-300" />
          <div className="aspect-video rounded bg-gradient-to-br from-purple-200 to-pink-300 ring-2 ring-emerald-500" />
          <div className="aspect-video rounded bg-gradient-to-br from-orange-200 to-red-300" />
          <div className="aspect-video rounded bg-gradient-to-br from-green-200 to-emerald-300" />
        </div>
      </div>
    );
  }
  return null;
}

export function FeaturesSection() {
  const [heroFeatures, setHeroFeatures] = useState<HeroFeature[]>(DEFAULT_HERO_FEATURES);
  const [microFeatures, setMicroFeatures] = useState<MicroFeature[]>(DEFAULT_MICRO_FEATURES);
  const [sectionHeader, setSectionHeader] = useState({
    badge: "Built for creators",
    headingLine1: "Everything you need.",
    headingLine2: "Nothing you don't.",
    subheading: "A complete creative toolkit powered by cutting-edge AI. From ideation to export.",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadFeaturesConfig() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", [
            "features_badge",
            "features_heading_line1",
            "features_heading_line2",
            "features_subheading",
            "landing_hero_features",
            "landing_micro_features",
          ]);

        if (settings && settings.length > 0) {
          const map: Record<string, string> = {};
          settings.forEach((s) => {
            map[s.key] = s.value;
          });

          setSectionHeader((prev) => ({
            badge: map.features_badge || prev.badge,
            headingLine1: map.features_heading_line1 || prev.headingLine1,
            headingLine2: map.features_heading_line2 || prev.headingLine2,
            subheading: map.features_subheading || prev.subheading,
          }));

          if (map.landing_hero_features) {
            try {
              const parsed = typeof map.landing_hero_features === "string" ? JSON.parse(map.landing_hero_features) : map.landing_hero_features;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setHeroFeatures(parsed);
              }
            } catch (e) {
              console.warn("Could not parse landing_hero_features:", e);
            }
          }

          if (map.landing_micro_features) {
            try {
              const parsed = typeof map.landing_micro_features === "string" ? JSON.parse(map.landing_micro_features) : map.landing_micro_features;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setMicroFeatures(parsed);
              }
            } catch (e) {
              console.warn("Could not parse landing_micro_features:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Error loading dynamic features configuration:", err);
      }
    }

    loadFeaturesConfig();
  }, [supabase]);

  return (
    <section id="features" className="relative py-24 md:py-32 bg-white dark:bg-slate-950 overflow-hidden">
      {/* Subtle background orbs */}
      <div className="orb orb-blue w-[400px] h-[400px] -top-20 -left-20 opacity-30" />
      <div className="orb orb-purple w-[400px] h-[400px] top-1/2 -right-20 opacity-30" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="pill-badge mb-6">
            <span>{sectionHeader.badge}</span>
          </div>
          <h2 className="hero-heading text-4xl md:text-6xl text-slate-900 dark:text-white mb-6">
            {sectionHeader.headingLine1}
            <br />
            <span className="gradient-text">{sectionHeader.headingLine2}</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
            {sectionHeader.subheading}
          </p>
        </motion.div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(280px,auto)] gap-4 mb-8">
          {heroFeatures.map((feature, i) => {
            const IconComponent = feature.iconName ? ICON_MAP[feature.iconName] || Wand2 : Wand2;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`apple-card p-6 md:p-8 bg-gradient-to-br ${feature.bg} ${feature.darkBg} ${feature.span} relative overflow-hidden`}
              >
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`feature-icon bg-gradient-to-br ${feature.color}`}>
                      <IconComponent className="w-6 h-6" strokeWidth={2.2} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-semibold text-slate-900 dark:text-white mb-3 tracking-tight leading-tight whitespace-pre-line">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-auto">
                    <BentoVisual type={feature.visual} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* MICRO FEATURES */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
        >
          {microFeatures.map((feature, i) => {
            const IconComponent = feature.iconName ? ICON_MAP[feature.iconName] || Globe : Globe;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="group flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${feature.bg}`}>
                  <IconComponent className={`h-5 w-5 ${feature.color}`} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{feature.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{feature.desc}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}