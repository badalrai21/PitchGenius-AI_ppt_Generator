"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Play, Zap, Image as ImageIcon, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_PROMPTS = [
  "AI startup pitch deck for Series A",
  "Q4 product launch presentation",
  "Climate change research summary",
  "Marketing strategy for 2025",
];

export function HeroSection() {
  const [prompts, setPrompts] = useState<string[]>(DEFAULT_PROMPTS);
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");

  const [heroMeta, setHeroMeta] = useState({
    badge: "Powered by Multi-AI Engine",
    headingLine1: "Presentations,",
    headingLine2: "reimagined.",
    subheading: "Turn a single prompt into a stunning deck in seconds. Beautiful design, powered by AI.",
    avgGenTime: "28 seconds",
    userCount: "50,000+ creators",
    mockupUrl: "pitchgenius.com/editor",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadHeroConfig() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", [
            "hero_prompts",
            "hero_badge",
            "hero_heading_line1",
            "hero_heading_line2",
            "hero_subheading",
            "metric_avg_generation",
            "metric_users_count",
            "app_url",
          ]);

        if (settings && settings.length > 0) {
          const map: Record<string, string> = {};
          settings.forEach((s) => {
            map[s.key] = s.value;
          });

          setHeroMeta((prev) => ({
            badge: map.hero_badge || prev.badge,
            headingLine1: map.hero_heading_line1 || prev.headingLine1,
            headingLine2: map.hero_heading_line2 || prev.headingLine2,
            subheading: map.hero_subheading || prev.subheading,
            avgGenTime: map.metric_avg_generation || prev.avgGenTime,
            userCount: map.metric_users_count || prev.userCount,
            mockupUrl: map.app_url ? map.app_url.replace(/^https?:\/\//, "") + "/editor" : prev.mockupUrl,
          }));

          if (map.hero_prompts) {
            try {
              const parsed = typeof map.hero_prompts === "string" ? JSON.parse(map.hero_prompts) : map.hero_prompts;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setPrompts(parsed);
              }
            } catch (e) {
              console.warn("Could not parse hero_prompts JSON:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Error loading dynamic hero settings:", err);
      }
    }

    loadHeroConfig();
  }, [supabase]);

  // Typing animation loop
  useEffect(() => {
    if (!prompts || prompts.length === 0) return;
    const currentPrompt = prompts[promptIndex % prompts.length];
    let charIndex = 0;

    const typing = setInterval(() => {
      if (charIndex <= currentPrompt.length) {
        setDisplayText(currentPrompt.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typing);
        setTimeout(() => {
          setPromptIndex((prev) => (prev + 1) % prompts.length);
        }, 2000);
      }
    }, 60);

    return () => clearInterval(typing);
  }, [promptIndex, prompts]);

  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      {/* Colorful floating orbs */}
      <div className="orb orb-pink w-[500px] h-[500px] -top-32 -left-32" style={{ animationDelay: "0s" }} />
      <div className="orb orb-blue w-[600px] h-[600px] -top-40 -right-40" style={{ animationDelay: "5s" }} />
      <div className="orb orb-purple w-[400px] h-[400px] top-96 left-1/2 -translate-x-1/2" style={{ animationDelay: "10s" }} />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="pill-badge">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{heroMeta.badge}</span>
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="hero-heading text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-slate-900 dark:text-white mb-6"
        >
          {heroMeta.headingLine1}
          <br />
          <span className="gradient-text-vibrant">{heroMeta.headingLine2}</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 font-light"
        >
          {heroMeta.subheading}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link href="/signup" className="btn-primary group text-base">
            Start Creating Free
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="#demo" className="btn-secondary group text-base">
            <Play className="w-4 h-4 mr-2" />
            Watch Demo
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400 mb-16"
        >
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-500" />
            <span>30s generation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-purple-500" />
            <span>AI images included</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-pink-500" />
            <span>Smart charts</span>
          </div>
        </motion.div>

        {/* Interactive prompt input mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs text-slate-500 mb-1">Prompt</div>
                  <div className="text-slate-900 dark:text-white font-medium truncate">
                    {displayText}
                    <span className="inline-block w-0.5 h-5 bg-cyan-500 ml-0.5 animate-pulse align-middle" />
                  </div>
                </div>
                <Link href="/editor/new" className="btn-primary flex-shrink-0 !px-4 !py-2 text-sm text-decoration-none">
                  Generate
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Product mockup with colorful backdrop */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Colorful backdrop glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-cyan-500/30 rounded-[3rem] blur-3xl" />

          {/* Browser frame */}
          <div className="product-frame relative bg-white dark:bg-slate-900">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 max-w-md mx-auto px-4 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-500 text-center">
                {heroMeta.mockupUrl}
              </div>
            </div>

            {/* Slide preview */}
            <div className="relative aspect-video bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-8 md:p-12">
              <div className="grid grid-cols-3 gap-4 h-full">
                {/* Sidebar - slide reel */}
                <div className="col-span-1 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`aspect-video rounded-lg border-2 ${
                        i === 1
                          ? "border-cyan-500 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      }`}
                    />
                  ))}
                </div>

                {/* Main slide */}
                <div className="col-span-2 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 p-8 md:p-10 flex flex-col justify-center text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1">
                    <Sparkles className="h-3 w-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI</span>
                  </div>
                  <div className="text-xs uppercase tracking-widest opacity-80 mb-3">Introducing</div>
                  <div className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                    The Future of Presentations
                  </div>
                  <div className="text-sm md:text-base opacity-90 max-w-md">
                    AI-powered design that adapts to your story. Beautiful, fast, effortless.
                  </div>
                  <div className="flex gap-2 mt-6">
                    <div className="w-8 h-1 rounded-full bg-white" />
                    <div className="w-2 h-1 rounded-full bg-white/40" />
                    <div className="w-2 h-1 rounded-full bg-white/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -left-6 md:-left-12 apple-card px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Generated in</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{heroMeta.avgGenTime}</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-6 -right-6 md:-right-12 apple-card px-4 py-3 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Loved by</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{heroMeta.userCount}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}