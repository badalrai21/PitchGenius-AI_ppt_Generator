"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Copy, Play, Download, Layout, Wand2, Image as ImageIcon,
  ArrowLeft, ChevronLeft, ChevronRight, Save, CheckCircle,
  Loader2, Palette, Share2, ZoomIn, ZoomOut, Send
} from "lucide-react";

import { usePresentationStore, DEFAULT_THEME, SAMPLE_SLIDES } from "@/stores/usePresentationStore";
import { SlideRenderer } from "@/components/editor/slides/SlideRenderer";
import { ThemePanel } from "@/components/editor/panels/ThemePanel";
import { ExportModal } from "@/components/editor/panels/ExportModal";
import { PresenterModal } from "@/components/editor/panels/PresenterModal";
import { ShareModal } from "@/components/editor/panels/ShareModal";
import { MediaPanel } from "@/components/editor/panels/MediaPanel";
import { BrandLoader, BrandSpinner } from "@/components/ui/BrandLoader";
import {
  TitleLayoutIcon,
  BulletsLayoutIcon,
  TwoColumnLayoutIcon,
  MetricsLayoutIcon,
  QuoteLayoutIcon,
} from "@/components/editor/ui/LayoutPreviews";
import { useAutoSave } from "@/hooks/useAutoSave";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { toast } from "sonner";

// Slide transition variants (Apple-style smooth entry)
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0, scale: 0.98 }),
};

// Layout templates that intelligently restructure slide content
const LAYOUT_TEMPLATES: Record<string, (slide: any) => any> = {
  title: (slide) => ({
    ...slide,
    layout: "title",
    subtitle: slide.subtitle || slide.body || (slide.bullets?.[0] ?? "A brief description of your topic"),
    bullets: undefined,
    left_column: undefined,
    right_column: undefined,
    metrics: undefined,
    quote: undefined,
  }),
  bullets: (slide) => ({
    ...slide,
    layout: "bullets",
    bullets: (slide.bullets && slide.bullets.length > 0) ? slide.bullets : [
      slide.subtitle || "Key insight or takeaway point one",
      slide.body || "Second impactful observation",
      slide.quote || "Third data-backed insight",
      "Fourth strategic implication",
    ].slice(0, 4),
    quote: undefined,
    quote_author: undefined,
    metrics: undefined,
    left_column: undefined,
    right_column: undefined,
  }),
  two_column: (slide) => ({
    ...slide,
    layout: "two_column",
    left_column: slide.left_column || {
      title: "Current State",
      points: (slide.bullets && slide.bullets.length > 0)
        ? slide.bullets.slice(0, 3)
        : ["Existing challenge one", "Existing challenge two", "Existing challenge three"],
    },
    right_column: slide.right_column || {
      title: "Future Vision",
      points: ["Strategic opportunity one", "Strategic opportunity two", "Strategic opportunity three"],
    },
    bullets: undefined,
    metrics: undefined,
    quote: undefined,
  }),
  metrics: (slide) => ({
    ...slide,
    layout: "metrics",
    metrics: (slide.metrics && slide.metrics.length > 0) ? slide.metrics : [
      { value: "10x", label: "Growth Rate", desc: "Year over year" },
      { value: "95%", label: "Retention", desc: "Customer satisfaction" },
      { value: "$5M", label: "Revenue", desc: "Annual recurring" },
    ],
    bullets: undefined,
    quote: undefined,
    left_column: undefined,
    right_column: undefined,
  }),
  quote: (slide) => ({
    ...slide,
    layout: "quote",
    quote: slide.quote || slide.subtitle || slide.body || (slide.bullets?.[0] ?? slide.title),
    quote_author: slide.quote_author || "Industry Leader",
    bullets: undefined,
    metrics: undefined,
    left_column: undefined,
    right_column: undefined,
  }),
};

export default function SlideEditorPage() {
  const params = useParams();
  const presentationId = params.id as string;
  const router = useRouter();

  const {
    id, title, slides, activeSlideIndex, theme,
    updateSlide, addSlide, deleteSlide, duplicateSlide,
    setActiveSlideIndex, setTitle, setPresentation, reorderSlides,
  } = usePresentationStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [activePanel, setActivePanel] = useState<"layout" | "theme" | "media" | "copilot">("layout");
  const [mounted, setMounted] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);

  const saveStatus = useAutoSave(id, slides, title);

  // Navigation helpers with sliding direction tracking
  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= slides.length || index === activeSlideIndex) return;
      setDirection(index > activeSlideIndex ? 1 : -1);
      setActiveSlideIndex(index);
    },
    [slides.length, activeSlideIndex, setActiveSlideIndex]
  );

  const goNext = useCallback(() => goToSlide(activeSlideIndex + 1), [activeSlideIndex, goToSlide]);
  const goPrev = useCallback(() => goToSlide(activeSlideIndex - 1), [activeSlideIndex, goToSlide]);

  const zoomIn = () => setZoom((z) => Math.min(150, z + 25));
  const zoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const zoomFit = () => setZoom(100);

  // Dynamic Hydration: always pulls real database record on ID mismatch
  useEffect(() => {
    setMounted(true);

    async function loadPresentation() {
      if (!presentationId) return;

      if (id !== presentationId || slides.length === 0) {
        setLoading(true);
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("presentations")
            .select("*")
            .eq("id", presentationId)
            .maybeSingle();

          if (!error && data && Array.isArray(data.slides_data) && data.slides_data.length > 0) {
            setPresentation({
              id: data.id,
              title: data.title || "Untitled Presentation",
              slides: data.slides_data,
              theme: data.custom_theme || DEFAULT_THEME,
              themeSlug: data.theme_id || "apple-studio",
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("[Editor] DB Presentation load warning:", err);
        }

        // Emergency fallback if network fails
        setPresentation({
          id: presentationId,
          title: "The Blue Ocean Strategy in SaaS",
          slides: SAMPLE_SLIDES,
          theme: DEFAULT_THEME,
          themeSlug: "apple-studio",
        });
        setLoading(false);
      } else {
        setLoading(false);
      }
    }

    loadPresentation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationId]);

  const activeSlide = slides[activeSlideIndex] || slides[0] || SAMPLE_SLIDES[0];
  const totalSlides = slides.length || 1;
  const progressPercent = ((activeSlideIndex + 1) / totalSlides) * 100;

  // Layout switcher action
  const handleLayoutChange = (newLayout: string) => {
    const transformer = LAYOUT_TEMPLATES[newLayout];
    if (transformer && activeSlide) {
      const transformed = transformer(activeSlide);
      updateSlide(activeSlideIndex, transformed);
      toast.success(`Switched to ${newLayout.replace("_", " ")} layout`);
    }
  };

  // AI Copilot with custom prompt input
  const handleAIEnhance = async (customAction?: string) => {
    if (!activeSlide) return;
    const action = customAction || copilotPrompt;
    if (!action.trim()) {
      toast.error("Please enter an instruction for the AI");
      return;
    }
    setIsEnhancing(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/v1/generate/enhance-slide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: activeSlide, action }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.slide) {
          updateSlide(activeSlideIndex, json.slide);
          toast.success("Slide enhanced successfully!");
          setCopilotPrompt("");
        }
      } else {
        const errData = await res.json().catch(() => ({ detail: "AI request failed" }));
        toast.error(errData.detail || "Enhancement failed. Please try again.");
      }
    } catch (e: any) {
      console.error("Enhance failed:", e);
      toast.error("Could not connect to AI. Check backend server.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault();
          goNext();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          goPrev();
        } else if (e.key === "Escape") {
          setIsFullscreen(false);
        }
        return;
      }
      if (e.key === "ArrowRight" && e.altKey) { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft" && e.altKey) { e.preventDefault(); goPrev(); }
      else if (e.key === "=" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomIn(); }
      else if (e.key === "-" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomOut(); }
      else if (e.key === "0" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); zoomFit(); }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [isFullscreen, goNext, goPrev]);

  if (!mounted || loading) {
    return <BrandLoader fullscreen size="lg" label="Loading your presentation..." />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none font-sans">
      {/* ═══════════ TOP HEADER ═══════════ */}
      <header className="h-14 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="hidden md:flex items-center gap-1.5">
            <Logo className="h-6 w-6" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-semibold font-display text-sm bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-cyan-500 dark:hover:border-slate-700 px-1 py-0.5 max-w-[180px] sm:max-w-[280px] text-slate-900 dark:text-white"
              placeholder="Untitled presentation"
            />

            {/* Autosave status indicator */}
            <div className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 uppercase tracking-wider">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-cyan-500" />
                  <span className="hidden sm:inline text-cyan-600 dark:text-cyan-400">Saving</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">Saved</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <Save className="h-3 w-3 text-amber-500" />
                  <span className="hidden sm:inline text-amber-600">Unsaved</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Level Controls */}
          <div className="hidden md:flex items-center gap-0.5 mr-1 px-1 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
            <button
              onClick={zoomOut}
              disabled={zoom <= 50}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
              title="Zoom Out (Ctrl+-)"
            >
              <ZoomOut className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={zoomFit}
              className="px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600 transition-colors min-w-[36px] text-center"
              title="Reset Zoom (Ctrl+0)"
            >
              {zoom}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoom >= 150}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
              title="Zoom In (Ctrl++)"
            >
              <ZoomIn className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(true)}
            className="btn-secondary !px-3.5 !py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <Play className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Present</span>
          </button>

          <button
            onClick={() => setShowShare(true)}
            className="btn-secondary !px-3.5 !py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={() => setShowExport(true)}
            className="btn-primary !px-3.5 !py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* ═══════════ GRADIENT PROGRESS BAR ═══════════ */}
      <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800 shrink-0">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* ═══════════ CORE PRESENTATION WORKSPACE ═══════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── LEFT REEL SIDEBAR ─── */}
        <aside className="w-52 border-r border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Slides · {totalSlides}
            </span>
            <button
              onClick={() => addSlide()}
              className="w-6 h-6 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 flex items-center justify-center transition-colors"
              title="Add Slide"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {(slides.length > 0 ? slides : SAMPLE_SLIDES).map((s, idx) => (
              <div
                key={s.id || idx}
                onClick={() => goToSlide(idx)}
                className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                  idx === activeSlideIndex
                    ? "border-cyan-500 shadow-md scale-[1.02]"
                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                }`}
              >
                {/* Slide number badge */}
                <div className="absolute top-1.5 left-1.5 z-20 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {String(idx + 1).padStart(2, "0")}
                </div>

                {/* Micro thumbnail preview scaled down */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: "scale(0.18)",
                    transformOrigin: "top left",
                    width: "555%",
                    height: "555%",
                  }}
                >
                  <SlideRenderer slide={s} theme={theme} isEditable={false} />
                </div>

                {/* Active indicator bar */}
                {idx === activeSlideIndex && (
                  <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-0.5 h-10 rounded-r-full bg-gradient-to-b from-cyan-500 to-blue-600 z-30" />
                )}

                {/* Reorder controls overlay */}
                <div className="absolute bottom-1 right-1 hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-0.5 z-30">
                  <button
                    disabled={idx === 0}
                    onClick={(e) => { e.stopPropagation(); reorderSlides(idx, idx - 1); }}
                    className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <button
                    disabled={idx === slides.length - 1}
                    onClick={(e) => { e.stopPropagation(); reorderSlides(idx, idx + 1); }}
                    className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-300 disabled:opacity-30"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Duplicate & Delete overlay */}
                <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-0.5 z-30">
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                    title="Duplicate"
                    className="p-0.5 hover:text-cyan-600 rounded hover:bg-cyan-500/10 text-slate-500"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                    title="Delete"
                    disabled={slides.length <= 1}
                    className="p-0.5 hover:text-red-500 rounded hover:bg-red-500/10 text-slate-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ─── CENTER CANVAS WORKSPACE ─── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.03] blur-[120px]" />
            <div className="absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/[0.03] blur-[120px]" />
          </div>

          <div className="flex-1 p-4 md:p-6 flex items-center justify-center overflow-hidden relative z-10 min-h-0">
            {/* Fluid responsive scaling container */}
            <div
              className="transition-transform duration-300 ease-out rounded-2xl overflow-hidden bg-white dark:bg-slate-900 relative"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "center center",
                width: "min(100%, calc((100vh - 200px) * 1.7778))",
                aspectRatio: "16 / 9",
                maxHeight: "calc(100vh - 200px)",
                boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.04), 0 20px 60px rgba(0, 0, 0, 0.12), 0 60px 120px rgba(0, 119, 182, 0.08)",
              }}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeSlideIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <SlideRenderer
                    slide={activeSlide}
                    theme={theme}
                    isEditable={true}
                    onUpdate={(fields) => updateSlide(activeSlideIndex, fields)}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Interactive Navigation Bar */}
          <div className="h-12 border-t border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 relative z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={activeSlideIndex === 0}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </button>

              <span className="text-xs font-semibold font-display tabular-nums min-w-[60px] text-center text-slate-700 dark:text-slate-300 font-sans">
                {activeSlideIndex + 1} / {totalSlides}
              </span>

              <button
                onClick={goNext}
                disabled={activeSlideIndex === totalSlides - 1}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="hidden md:flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === activeSlideIndex
                      ? "w-6 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600"
                      : "w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-cyan-500/50"
                  }`}
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="pill-badge !text-[10px] !px-2.5 !py-0.5 uppercase tracking-wider">
                {activeSlide?.layout || "bullets"}
              </span>
              <span className="text-[10px] text-slate-400 hidden lg:inline font-sans">
                Alt+← → to navigate
              </span>
            </div>
          </div>
        </main>

        {/* ─── RIGHT INSPECTOR PANEL ─── */}
        <aside className="w-72 border-l border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-y-auto shrink-0 flex flex-col">
          <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 h-12 shrink-0">
            {[
              { key: "layout", icon: Layout, label: "Layout" },
              { key: "theme", icon: Palette, label: "Theme" },
              { key: "media", icon: ImageIcon, label: "Media" },
              { key: "copilot", icon: Wand2, label: "AI" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActivePanel(tab.key as any)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold border-b-2 transition-all ${
                  activePanel === tab.key
                    ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-5 flex-1">
            {/* Layout switch options */}
            {activePanel === "layout" && (
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Choose slide layout
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { key: "title", component: TitleLayoutIcon, label: "Title" },
                    { key: "bullets", component: BulletsLayoutIcon, label: "Bullets" },
                    { key: "two_column", component: TwoColumnLayoutIcon, label: "Split" },
                    { key: "metrics", component: MetricsLayoutIcon, label: "Metrics" },
                    { key: "quote", component: QuoteLayoutIcon, label: "Quote" },
                  ].map((lay) => {
                    const isActive = activeSlide.layout === lay.key;
                    return (
                      <button
                        key={lay.key}
                        onClick={() => handleLayoutChange(lay.key)}
                        className={`group rounded-2xl border p-3 text-left transition-all ${
                          isActive
                            ? "border-cyan-500 bg-cyan-500/[0.03]"
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        <lay.component />
                        <div className={`text-[10px] font-bold uppercase tracking-wider mt-2 text-center transition-colors ${
                          isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                        }`}>
                          {lay.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic theme selector */}
            {activePanel === "theme" && (
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Workspace theme
                </p>
                <ThemePanel />
              </div>
            )}

            {/* Tri-provider media suite */}
            {activePanel === "media" && (
              <MediaPanel />
            )}

            {/* AI Assistant Copilot */}
            {activePanel === "copilot" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Wand2 className="h-3 w-3" /> AI Copilot
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Instant slide enhancements with one tap.
                  </p>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={copilotPrompt}
                    onChange={(e) => setCopilotPrompt(e.target.value)}
                    placeholder="e.g., Make tone more professional and add specific numbers"
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                    disabled={isEnhancing}
                  />
                  <button
                    onClick={() => handleAIEnhance()}
                    disabled={isEnhancing || !copilotPrompt.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isEnhancing ? (
                      <>
                        <BrandSpinner className="w-3.5 h-3.5" />
                        <span>Enhancing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enhance Slide</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Quick actions
                  </p>
                  {[
                    { action: "Rewrite this slide to sound more professional and executive-level", emoji: "💼", label: "Make professional", color: "from-cyan-500 to-blue-600" },
                    { action: "Make this slide more concise and punchy. Cut all fluff and redundant words.", emoji: "✂️", label: "Make it concise", color: "from-pink-500 to-rose-500" },
                    { action: "Add specific real-world data, statistics, and measurable outcomes to this slide", emoji: "📊", label: "Add real stats", color: "from-emerald-500 to-teal-600" },
                    { action: "Make this slide more engaging with storytelling elements and vivid language", emoji: "🎭", label: "More engaging", color: "from-purple-500 to-pink-500" },
                  ].map((a) => (
                    <button
                      key={a.label}
                      disabled={isEnhancing}
                      onClick={() => handleAIEnhance(a.action)}
                      className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-sm text-xs font-medium flex items-center justify-between group transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center text-white text-xs`}>
                          {a.emoji}
                        </div>
                        <span className="text-slate-800 dark:text-slate-200">{a.label}</span>
                      </div>
                      {isEnhancing && <Loader2 className="h-3 w-3 animate-spin text-cyan-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ═══════════ PRESENTATION PRESENTER STUDIO MODAL ═══════════ */}
      <PresenterModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        slides={slides.length > 0 ? slides : SAMPLE_SLIDES}
        theme={theme}
        initialSlideIndex={activeSlideIndex}
      />

      {/* MODALS */}
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} presentationId={presentationId} />
    </div>
  );
}