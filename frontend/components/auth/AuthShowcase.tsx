"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Layers, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ShowcaseProps {
  variant?: "login" | "signup" | "reset";
}

interface TaglineSet {
  eyebrow: string;
  headline: string;
  gradient: string;
  subtext: string;
  icon: any;
  iconGradient: string;
}

const TAGLINES: Record<string, TaglineSet[]> = {
  login: [
    {
      eyebrow: "Welcome back",
      headline: "Create with\nintelligence.",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0077B6 50%, #7c3aed 100%)",
      subtext: "Your next breakthrough presentation is just seconds away.",
      icon: Sparkles,
      iconGradient: "linear-gradient(135deg, #06b6d4, #0077B6)",
    },
    {
      eyebrow: "Powered by AI",
      headline: "Design without\nlimits.",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%)",
      subtext: "Every slide, crafted by world-class designers.",
      icon: Wand2,
      iconGradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    },
    {
      eyebrow: "Ship faster",
      headline: "From idea\nto reality.",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)",
      subtext: "Transform any thought into a stunning deck in under 30 seconds.",
      icon: Zap,
      iconGradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    },
  ],
  signup: [
    {
      eyebrow: "Get started",
      headline: "Your story,\nelevated.",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0077B6 50%, #7c3aed 100%)",
      subtext: "Join creators building presentations that captivate and convert.",
      icon: Sparkles,
      iconGradient: "linear-gradient(135deg, #06b6d4, #0077B6)",
    },
    {
      eyebrow: "Built for speed",
      headline: "Zero learning\ncurve.",
      gradient: "linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #0077B6 100%)",
      subtext: "Start creating in seconds. No design skills required.",
      icon: Zap,
      iconGradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    },
    {
      eyebrow: "Trusted by thousands",
      headline: "Loved by\ncreators.",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%)",
      subtext: "Join 50,000+ professionals shipping better presentations, faster.",
      icon: Layers,
      iconGradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    },
  ],
  reset: [
    {
      eyebrow: "Secure by design",
      headline: "You're in\ncontrol.",
      gradient: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
      subtext: "Enterprise-grade security to keep your work safe.",
      icon: Sparkles,
      iconGradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    },
    {
      eyebrow: "Almost there",
      headline: "One step\naway.",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0077B6 100%)",
      subtext: "Set your new password and continue creating.",
      icon: Zap,
      iconGradient: "linear-gradient(135deg, #06b6d4, #0077B6)",
    },
  ],
};

export function AuthShowcase({ variant = "login" }: ShowcaseProps) {
  const [mounted, setMounted] = useState(false);
  const [taglines, setTaglines] = useState<TaglineSet[]>(TAGLINES[variant]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);

    async function loadDynamicTaglines() {
      try {
        const { data: settingData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", `auth_taglines_${variant}`)
          .maybeSingle();

        if (settingData?.value) {
          const parsed =
            typeof settingData.value === "string"
              ? JSON.parse(settingData.value)
              : settingData.value;
          if (Array.isArray(parsed) && parsed.length > 0) setTaglines(parsed);
        }
      } catch (err) {
        console.warn("Using default taglines:", err);
      }
    }

    loadDynamicTaglines();
  }, [variant, supabase]);

  useEffect(() => {
    if (!mounted || taglines.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % taglines.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [mounted, taglines.length]);

  if (!mounted) return null;

  const current = taglines[currentIndex];
  const IconComponent = current.icon;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center p-12 lg:p-16 xl:p-20">
      {/* ═══════════ AMBIENT BACKGROUND ═══════════ */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(0,180,216,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 60%, rgba(139,92,246,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 40% 90%, rgba(236,72,153,0.06) 0%, transparent 60%),
            linear-gradient(180deg, #fafcff 0%, #f8f9fc 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(0,180,216,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 60%, rgba(139,92,246,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 40% 90%, rgba(236,72,153,0.08) 0%, transparent 60%),
            linear-gradient(180deg, #0a0f1e 0%, #030712 100%)
          `,
        }}
      />

      {/* Animated aurora orbs */}
      <motion.div
        className="absolute top-[15%] right-[10%] w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[15%] left-[10%] w-[450px] h-[450px] rounded-full opacity-25 dark:opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)",
          filter: "blur(110px)",
        }}
        animate={{ scale: [1, 1.15, 1], x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute top-[45%] left-[45%] w-[350px] h-[350px] rounded-full opacity-20 dark:opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      {/* Fine mesh grid — very subtle */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
        }}
      />

      {/* Noise grain */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ═══════════ CONTENT ═══════════ */}
      <div className="relative w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(12px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Icon badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{
                background: current.iconGradient,
                boxShadow: `0 20px 40px -10px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
              }}
            >
              <IconComponent className="w-8 h-8 text-white" strokeWidth={2} />
            </motion.div>

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                {current.eyebrow}
              </span>
            </motion.div>

            {/* Main Headline — matches landing page hero-heading style */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold tracking-tight leading-[0.95] whitespace-pre-line"
              style={{
                fontSize: "clamp(3rem, 6vw, 5.5rem)",
                background: current.gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.03em",
              }}
            >
              {current.headline}
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg xl:text-xl text-slate-600 dark:text-slate-300 font-light leading-relaxed max-w-md"
            >
              {current.subtext}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress indicators */}
        <div className="flex items-center gap-1.5 mt-14">
          {taglines.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="h-[3px] rounded-full transition-all duration-500 cursor-pointer overflow-hidden"
              style={{
                width: currentIndex === idx ? "40px" : "16px",
                background: currentIndex === idx ? "transparent" : "rgba(100, 116, 139, 0.3)",
              }}
            >
              {currentIndex === idx && (
                <motion.div
                  key={`prog-${idx}-${currentIndex}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 6, ease: "linear" }}
                  className="h-full rounded-full"
                  style={{
                    background: current.gradient,
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Bottom credibility line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex items-center gap-6 mt-12 pt-8 border-t border-slate-200/50 dark:border-slate-800/50"
        >
          {[
            { value: "50K+", label: "Creators" },
            { value: "1M+", label: "Decks" },
            { value: "4.9★", label: "Rating" },
          ].map((stat, i) => (
            <div key={i}>
              <div
                className="text-xl font-bold font-display tracking-tight"
                style={{
                  background: current.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}