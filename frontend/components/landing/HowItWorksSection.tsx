"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquareText, Wand2, Presentation, Sparkles, Layers,
  Rocket, Palette, Download, CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StepItem {
  number: string;
  iconName: string;
  title: string;
  description: string;
  color: string;
  bg: string;
  darkBg: string;
}

const ICON_MAP: Record<string, any> = {
  MessageSquareText,
  Wand2,
  Presentation,
  Sparkles,
  Layers,
  Rocket,
  Palette,
  Download,
  CheckCircle2,
};

const DEFAULT_STEPS: StepItem[] = [
  {
    number: "01",
    iconName: "MessageSquareText",
    title: "Describe your idea",
    description: "Type a topic, paste your notes, or upload a document. Tell AI exactly what you want.",
    color: "from-pink-500 to-rose-500",
    bg: "from-pink-50 to-rose-50",
    darkBg: "dark:from-pink-950/20 dark:to-rose-950/20",
  },
  {
    number: "02",
    iconName: "Wand2",
    title: "AI does the magic",
    description: "Generates copy, picks the perfect theme, creates images and charts — all in seconds.",
    color: "from-cyan-500 to-blue-600",
    bg: "from-cyan-50 to-blue-50",
    darkBg: "dark:from-cyan-950/20 dark:to-blue-950/20",
  },
  {
    number: "03",
    iconName: "Presentation",
    title: "Edit & present",
    description: "Customize in our drag-drop editor. Export as PPTX or PDF. Present from your browser.",
    color: "from-purple-500 to-indigo-600",
    bg: "from-purple-50 to-indigo-50",
    darkBg: "dark:from-purple-950/20 dark:to-indigo-950/20",
  },
];

export function HowItWorksSection() {
  const [steps, setSteps] = useState<StepItem[]>(DEFAULT_STEPS);
  const [headerInfo, setHeaderInfo] = useState({
    badge: "How it works",
    headingLine1: "From blank slate to",
    headingLine2: "stunning deck.",
    subheading: "Three simple steps. Zero design skills required.",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadStepsFromDB() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", [
            "how_it_works_badge",
            "how_it_works_heading_line1",
            "how_it_works_heading_line2",
            "how_it_works_subheading",
            "how_it_works_steps",
          ]);

        if (settings && settings.length > 0) {
          const map: Record<string, string> = {};
          settings.forEach((s) => {
            map[s.key] = s.value;
          });

          setHeaderInfo((prev) => ({
            badge: map.how_it_works_badge || prev.badge,
            headingLine1: map.how_it_works_heading_line1 || prev.headingLine1,
            headingLine2: map.how_it_works_heading_line2 || prev.headingLine2,
            subheading: map.how_it_works_subheading || prev.subheading,
          }));

          if (map.how_it_works_steps) {
            try {
              const parsed = typeof map.how_it_works_steps === "string" 
                ? JSON.parse(map.how_it_works_steps) 
                : map.how_it_works_steps;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSteps(parsed);
              }
            } catch (e) {
              console.warn("Could not parse how_it_works_steps JSON:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Error loading dynamic HowItWorks settings:", err);
      }
    }

    loadStepsFromDB();
  }, [supabase]);

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="pill-badge mb-6">
            <span>{headerInfo.badge}</span>
          </div>
          <h2 className="hero-heading text-4xl md:text-6xl text-slate-900 dark:text-white mb-6">
            {headerInfo.headingLine1}
            <br />
            <span className="gradient-text-vibrant">{headerInfo.headingLine2}</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
            {headerInfo.subheading}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
          {steps.map((step, i) => {
            const IconComponent = step.iconName ? ICON_MAP[step.iconName] || Wand2 : Wand2;
            return (
              <motion.div
                key={step.number || i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative"
              >
                {/* Connecting line (except last) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-8 h-px z-0">
                    <div className="h-px bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-700" />
                  </div>
                )}

                <div className={`apple-card p-8 h-full bg-gradient-to-br ${step.bg} ${step.darkBg} relative`}>
                  {/* Number + Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`feature-icon bg-gradient-to-br ${step.color}`}>
                      <IconComponent className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="text-6xl font-display font-bold text-slate-200 dark:text-slate-800">
                      {step.number}
                    </div>
                  </div>

                  <h3 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}