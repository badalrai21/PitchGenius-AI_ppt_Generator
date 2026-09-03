"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, Layers, Compass, ArrowRight, ChevronLeft, ChevronRight, Eye, Plus, Loader2 } from "lucide-react";
import { usePresentationStore, DEFAULT_THEME } from "@/stores/usePresentationStore";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Template {
  id?: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  themeSlug?: string;
  themeConfig?: any;
  theme_config?: any;
  slides?: any[];
  slides_layout?: any[];
  is_premium?: boolean;
}

const FALLBACK_TEMPLATES: Template[] = [
  {
    slug: "pitch-perfect",
    name: "Series-A Pitch Deck",
    category: "Business",
    description: "Classic venture-capital strategy framework designed to present metrics, growth, and team vision.",
    themeSlug: "apple-executive",
    themeConfig: { primary: "#0077B6", secondary: "#1D1D1F", accent: "#86868B", bg: "#FFFFFF", text: "#1D1D1F", muted: "#86868B", gradient: "linear-gradient(135deg, #0077B6 0%, #1D1D1F 100%)" },
    slides: [
      { layout: "title", title: "Scale Battery Grids", subtitle: "Clean Energy Infrastructure for Coastal Communities" },
      { layout: "bullets", title: "Problem Definition", bullets: ["Coastal energy reliance on diesel generators", "Heavy environmental footprint", "High logistics maintenance overhead costs"] },
      { layout: "metrics", title: "Traction Metrics", metrics: [{ value: "95%", label: "Grid Stability" }, { value: "3.5x", label: "Cost Efficiency" }, { value: "12K+", label: "Active Connections" }] },
    ]
  },
  {
    slug: "midnight-nova",
    name: "Creative Portfolio",
    category: "Creative",
    description: "Futuristic neon dark theme for designers, photographers, and studios.",
    themeSlug: "space-gray",
    themeConfig: { primary: "#0A84FF", secondary: "#3A3A3C", accent: "#8E8E93", bg: "#161617", text: "#F5F5F7", muted: "#8E8E93", gradient: "linear-gradient(135deg, #161617 0%, #2C2C2E 100%)" },
    slides: [
      { layout: "title", title: "INSIDE STUDIO", subtitle: "2025 Creative Portfolio Compilation" },
      { layout: "two_column", title: "Our Specialties", left_column: { title: "Art Direction", points: ["Editorial Layouts", "Vibrant Brand Identity"] }, right_column: { title: "3D Render", points: ["Blender Prototypes", "Product Mockups"] } },
    ]
  }
];

export default function TemplatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const setPresentation = usePresentationStore((state) => state.setPresentation);

  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const { data: dbTemplates, error: templatesError } = await supabase
          .from("templates").select("*").eq("is_active", true).order("sort_order", { ascending: true });

        if (!templatesError && dbTemplates && dbTemplates.length > 0) {
          const normalized = dbTemplates.map((t) => ({
            ...t,
            slides: Array.isArray(t.slides_layout) && t.slides_layout.length > 0 ? t.slides_layout : (t.slides || []),
            themeConfig: t.theme_config || t.colors || DEFAULT_THEME,
            themeSlug: t.slug || "apple-studio",
          }));
          setTemplates(normalized);
        } else {
          setTemplates(FALLBACK_TEMPLATES);
        }
      } catch (err) {
        setTemplates(FALLBACK_TEMPLATES);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  const categories = useMemo(() => {
    if (templates.length === 0) return ["All", "Business", "Creative", "Corporate"];
    const unique = Array.from(new Set(templates.map((t) => t.category).filter(Boolean)));
    return ["All", ...unique];
  }, [templates]);

  const handleUseTemplate = async (template: Template) => {
    setLoadingTemplate(template.slug);
    toast.info(`Instantiating ${template.name}...`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication missing.");

      const slidesToUse = template.slides_layout || template.slides || [];
      const themeConfigToUse = template.theme_config || template.themeConfig || DEFAULT_THEME;

      const { data: newDeck, error: insertError } = await supabase
        .from("presentations")
        .insert({
          user_id: user.id,
          title: `${template.name} — Copy`,
          slides_data: slidesToUse,
          slide_count: slidesToUse.length,
          status: "completed",
          source_type: "prompt",
          prompt: `Duplicated from template: ${template.name}`,
          custom_theme: themeConfigToUse,
        })
        .select().single();

      if (insertError) throw insertError;

      setPresentation({
        id: newDeck.id,
        title: newDeck.title,
        slides: newDeck.slides_data,
        theme: newDeck.custom_theme || DEFAULT_THEME,
        themeSlug: template.themeSlug || template.slug || "apple-studio",
      });

      toast.success(`${template.name} created!`);
      router.refresh();
      router.push(`/editor/${newDeck.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create template.");
      setLoadingTemplate(null);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, activeCategory, searchQuery]);

  const previewSlides = previewTemplate?.slides_layout || previewTemplate?.slides || [];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="pill-badge mb-3">
            <Compass className="w-3.5 h-3.5 text-cyan-600" />
            <span>SaaS Gallery Presets</span>
          </div>
          <h1 className="hero-heading text-4xl md:text-5xl text-slate-900 dark:text-white mb-2">
            Template <span className="gradient-text-vibrant">Marketplace</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-light">Skip the blank canvas. Pick a pre-structured designer preset and start building instantly.</p>
        </div>

        <div className="relative shrink-0 w-full md:w-80">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search designer decks..." className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white font-sans" />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Dynamic Categories Row */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-1">
        {categories.map((category) => (
          <button key={category} onClick={() => !loading && setActiveCategory(category)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${activeCategory === category ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}>{category}</button>
        ))}
      </div>

      {/* Templates Display Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!mounted || loading) ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="apple-card flex flex-col justify-between overflow-hidden border border-slate-200/60 dark:border-slate-800/60 animate-pulse bg-white dark:bg-slate-900" style={{ minHeight: "360px" }}>
              <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800 p-6 flex flex-col justify-between" />
              <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                <div className="space-y-2">
                  <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800/50 rounded" />
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800"><div className="h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full" /><div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-full" /></div>
              </div>
            </div>
          ))
        ) : (
          filteredTemplates.map((template, idx) => {
            const gradients = ["from-cyan-500 via-blue-500 to-indigo-600", "from-pink-500 via-fuchsia-500 to-purple-600", "from-emerald-500 via-teal-500 to-cyan-600"];
            const isInstantiating = loadingTemplate === template.slug;
            const currentSlides = template.slides_layout || template.slides || [];

            return (
              <div key={template.slug || idx} className="apple-card group flex flex-col justify-between overflow-hidden border border-slate-200/60 dark:border-slate-800/60">
                <div onClick={() => { setPreviewTemplate(template); setPreviewSlideIdx(0); }} className={`aspect-[16/10] bg-gradient-to-br ${gradients[idx % gradients.length]} p-6 flex flex-col justify-between relative cursor-pointer hover:opacity-95 transition-opacity overflow-hidden`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_60%)]" />
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white">{currentSlides.length} slides</span>
                      <Layers className="w-4 h-4 text-white/80" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-white/80" />
                        <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">{template.is_premium ? "Pro Preset" : "Premium Preset"}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white leading-tight font-display">{template.name}</h3>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-between flex-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white font-display mb-1.5">{template.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed mb-6 line-clamp-3">{template.description}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                    <button onClick={() => handleUseTemplate(template)} disabled={loadingTemplate !== null} className="btn-primary group !px-4 !py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 flex-1 disabled:opacity-50">
                      {isInstantiating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Creating...</span></> : <><Plus className="w-3.5 h-3.5" strokeWidth={2.5} /><span>Use Template</span></>}
                    </button>
                    <button onClick={() => { setPreviewTemplate(template); setPreviewSlideIdx(0); }} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shrink-0" title="Quick Preview"><Eye className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ═══════════ MODAL CAROUSEL PREVIEW ═══════════ */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewTemplate(null)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="apple-card relative z-10 w-full max-w-4xl p-8 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
                <div>
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Preview Mode · {previewTemplate.category}</span>
                  <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-1">{previewTemplate.name}</h2>
                </div>
                <button onClick={() => setPreviewTemplate(null)} className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors">Close</button>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-950 flex items-center justify-center shadow-inner shrink-0">
                <div className="w-full h-full p-12 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-center text-center">
                  <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-4">Slide {previewSlideIdx + 1} of {previewSlides.length} · Layout: {previewSlides[previewSlideIdx]?.layout || "standard"}</span>
                  <h3 className="hero-heading text-3xl md:text-4xl text-slate-900 dark:text-white font-semibold">{previewSlides[previewSlideIdx]?.title}</h3>
                  {previewSlides[previewSlideIdx]?.subtitle && <p className="text-sm text-slate-500 mt-2">{previewSlides[previewSlideIdx]?.subtitle}</p>}
                </div>

                <button onClick={() => setPreviewSlideIdx((i) => Math.max(0, i - 1))} disabled={previewSlideIdx === 0} className="absolute left-4 w-10 h-10 rounded-full bg-slate-950/40 hover:bg-slate-950/60 flex items-center justify-center text-white disabled:opacity-30 transition-all border border-white/10"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => setPreviewSlideIdx((i) => Math.min(previewSlides.length - 1, i + 1))} disabled={previewSlideIdx === previewSlides.length - 1} className="absolute right-4 w-10 h-10 rounded-full bg-slate-950/40 hover:bg-slate-950/60 flex items-center justify-center text-white disabled:opacity-30 transition-all border border-white/10"><ChevronRight className="w-5 h-5" /></button>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <span className="text-xs text-slate-400">Flip through slides to preview before cloning into your account.</span>
                <button onClick={() => { handleUseTemplate(previewTemplate); setPreviewTemplate(null); }} className="btn-primary group !px-6 !py-3 text-sm font-bold">
                  <span>Use This Template</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}