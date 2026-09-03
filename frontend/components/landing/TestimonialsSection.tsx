"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  rating: number;
}

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    quote: "PitchGenius saved me 10+ hours per week. What used to take a full day now takes minutes.",
    name: "Sarah Chen",
    role: "Product Manager, Notion",
    avatar: "SC",
    color: "from-pink-500 to-rose-500",
    rating: 5,
  },
  {
    quote: "I closed a $2M seed round with a deck I made in 15 minutes. The design quality is insane.",
    name: "Marcus Rodriguez",
    role: "Founder, Vault AI",
    avatar: "MR",
    color: "from-cyan-500 to-blue-600",
    rating: 5,
  },
  {
    quote: "Finally, a tool that gets design right. My students love using it for their projects.",
    name: "Dr. Emily Park",
    role: "Professor, Stanford",
    avatar: "EP",
    color: "from-purple-500 to-indigo-600",
    rating: 5,
  },
  {
    quote: "We replaced 3 tools with PitchGenius. Our whole marketing team is obsessed.",
    name: "James Thompson",
    role: "CMO, Linear",
    avatar: "JT",
    color: "from-emerald-500 to-teal-600",
    rating: 5,
  },
  {
    quote: "The AI understands context in a way I've never seen. It's like having a designer on call.",
    name: "Priya Sharma",
    role: "Consultant, McKinsey",
    avatar: "PS",
    color: "from-orange-500 to-red-500",
    rating: 5,
  },
  {
    quote: "From idea to investor-ready deck in under 30 minutes. Absolutely game-changing.",
    name: "Alex Kim",
    role: "Founder, Nexus Labs",
    avatar: "AK",
    color: "from-yellow-500 to-orange-500",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(DEFAULT_TESTIMONIALS);
  const [sectionHeader, setSectionHeader] = useState({
    badge: "Loved by creators",
    headingLine1: "Don't take",
    headingLine2: "our word for it.",
    subheading: "Join 50,000+ creators building better presentations, faster.",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadTestimonialsFromDB() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", [
            "testimonials_badge",
            "testimonials_heading_line1",
            "testimonials_heading_line2",
            "testimonials_subheading",
            "landing_testimonials",
          ]);

        if (settings && settings.length > 0) {
          const map: Record<string, string> = {};
          settings.forEach((s) => {
            map[s.key] = s.value;
          });

          setSectionHeader((prev) => ({
            badge: map.testimonials_badge || prev.badge,
            headingLine1: map.testimonials_heading_line1 || prev.headingLine1,
            headingLine2: map.testimonials_heading_line2 || prev.headingLine2,
            subheading: map.testimonials_subheading || prev.subheading,
          }));

          if (map.landing_testimonials) {
            try {
              const parsed = typeof map.landing_testimonials === "string" 
                ? JSON.parse(map.landing_testimonials) 
                : map.landing_testimonials;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTestimonials(parsed);
              }
            } catch (e) {
              console.warn("Could not parse landing_testimonials JSON:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Error loading dynamic testimonials:", err);
      }
    }

    loadTestimonialsFromDB();
  }, [supabase]);

  return (
    <section className="relative py-24 md:py-32 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
      <div className="orb orb-purple w-[500px] h-[500px] top-20 -right-40 opacity-20" />
      <div className="orb orb-pink w-[400px] h-[400px] bottom-20 -left-20 opacity-20" />

      <div className="relative max-w-7xl mx-auto px-6">
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
            <span className="gradient-text-vibrant">{sectionHeader.headingLine2}</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light">
            {sectionHeader.subheading}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="apple-card p-8 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating || 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.color || "from-cyan-500 to-blue-600"} flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}