"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Copy, Check, ExternalLink, Eye
} from "lucide-react";
import { SlideRenderer } from "@/components/editor/slides/SlideRenderer";
import { Logo } from "@/components/ui/Logo";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { config } from "@/lib/config";
import { DEFAULT_THEME } from "@/stores/usePresentationStore";

function detectDeviceType(): string {
  if (typeof window === "undefined") return "Desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return "Mobile";
  }
  return "Desktop";
}

export default function PublicPresentationPage() {
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();

  const [presentation, setPresentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [creatorName, setCreatorName] = useState<string>("");

  // Responsive slide sizing container ref
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [slideSize, setSlideSize] = useState({ width: 0, height: 0 });

  // ResizeObserver for responsive slide fit
  useEffect(() => {
    if (!presentation) return;

    const calculateSize = () => {
      const container = slideContainerRef.current?.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const availableWidth = containerRect.width - 32;
      const availableHeight = containerRect.height - 32;

      const aspectRatio = 16 / 9;
      let width = availableWidth;
      let height = width / aspectRatio;

      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }

      setSlideSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    calculateSize();

    const container = slideContainerRef.current?.parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver(calculateSize);
    resizeObserver.observe(container);
    window.addEventListener("resize", calculateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateSize);
    };
  }, [presentation, isFullscreen]);

  // Load presentation and record real database analytics event
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        // 1. Try share_token first, then fallback to direct id
        let { data, error: fetchError } = await supabase
          .from("presentations")
          .select("*")
          .eq("share_token", token)
          .eq("is_public", true)
          .maybeSingle();

        if (!data) {
          const result = await supabase
            .from("presentations")
            .select("*")
            .eq("id", token)
            .eq("is_public", true)
            .maybeSingle();
          data = result.data;
          fetchError = result.error;
        }

        if (fetchError || !data) {
          setError("This presentation is not available or has been set to private.");
          setLoading(false);
          return;
        }

        setPresentation(data);
        const newViews = (data.view_count || 0) + 1;
        setViewCount(newViews);

        // 2. Non-blocking Database View Count update
        supabase
          .from("presentations")
          .update({ view_count: newViews })
          .eq("id", data.id)
          .then();

        // 3. ★ Non-blocking Real Analytics Ingestion
        const deviceType = detectDeviceType();
        const referrerUrl = typeof document !== "undefined" ? document.referrer || "Direct" : "Direct";
        
        supabase
          .from("presentation_analytics")
          .insert({
            presentation_id: data.id,
            event_type: "view",
            device_type: deviceType,
            referrer: referrerUrl.slice(0, 255),
          })
          .then();

        // 4. Fetch creator profile details
        if (data.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", data.user_id)
            .maybeSingle();
          if (profile?.full_name) {
            setCreatorName(profile.full_name);
          }
        }

        // Set document title in browser tab
        if (data.title) {
          document.title = `${data.title} | ${config.app.name}`;
        }

        setLoading(false);
      } catch (err) {
        console.error("[PublicView] Error loading presentation:", err);
        setError("Could not load presentation.");
        setLoading(false);
      }
    })();
  }, [token, supabase]);

  const goPrev = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentSlide((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentSlide((i) => Math.min((presentation?.slides_data?.length || 1) - 1, i + 1));
  }, [presentation]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied to clipboard!", { duration: 1500 });
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  // Loading State
  if (loading) {
    return <BrandLoader fullscreen size="lg" label="Loading presentation..." />;
  }

  // Error State
  if (error || !presentation) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <Logo className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">
              Presentation Not Available
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {error || "This presentation may be private or has been removed."}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Logo className="w-4 h-4" />
            Go to {config.app.name}
          </Link>
        </div>
      </div>
    );
  }

  const slides = presentation.slides_data || [];
  const slide = slides[currentSlide];
  const theme = presentation.custom_theme || DEFAULT_THEME;
  const progressPercent = slides.length > 0 ? ((currentSlide + 1) / slides.length) * 100 : 0;

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-900 flex flex-col overflow-hidden font-sans">
      {/* ═══════════ TOP HEADER — Brand + Meta ═══════════ */}
      {!isFullscreen && (
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm">
          {/* Left: Brand + presentation info */}
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <Logo className="w-8 h-8 transition-transform group-hover:scale-105" />
              <span className="hidden sm:block font-display font-bold text-base text-slate-900 dark:text-white">
                {config.app.name}
              </span>
            </Link>

            <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate font-display">
                {presentation.title || "Untitled Presentation"}
              </h1>
              {creatorName && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  by <span className="font-semibold text-slate-700 dark:text-slate-300">{creatorName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View count */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{viewCount}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">views</span>
            </div>

            {/* Slide counter */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {currentSlide + 1} / {slides.length}
              </span>
            </div>

            {/* Copy link */}
            <button
              onClick={copyLink}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          </div>
        </header>
      )}

      {/* Progress bar */}
      {!isFullscreen && (
        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 shrink-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* ═══════════ SLIDE VIEWPORT ═══════════ */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden min-h-0 relative">
        {slides.length === 0 ? (
          <div className="text-center">
            <BrandLoader size="md" variant="inline" label="Loading slides..." />
          </div>
        ) : (
          <div
            ref={slideContainerRef}
            className="relative"
            style={{
              width: slideSize.width > 0 ? `${slideSize.width}px` : "auto",
              height: slideSize.height > 0 ? `${slideSize.height}px` : "auto",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                {slide ? (
                  <SlideRenderer slide={slide} theme={theme} isEditable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-2xl">
                    <p className="text-slate-500">Slide not available</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={currentSlide === 0}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg border border-slate-200 dark:border-slate-700 z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={currentSlide === slides.length - 1}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg border border-slate-200 dark:border-slate-700 z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* Slide dots */}
        {slides.length > 1 && slides.length <= 20 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg z-20">
            {slides.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentSlide
                    ? "w-6 h-2 bg-gradient-to-r from-cyan-500 to-blue-600"
                    : "w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Fullscreen exit hint */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-6 right-6 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 transition-colors z-20"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Exit Fullscreen (Esc)
          </button>
        )}
      </div>

      {/* ═══════════ BOTTOM FOOTER — Branded ═══════════ */}
      {!isFullscreen && (
        <footer className="h-12 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              Made with <span className="font-bold text-slate-700 dark:text-slate-300">{config.app.name}</span>
            </span>
          </div>

          <Link
            href="/"
            className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 font-display"
          >
            Create your own
            <ExternalLink className="w-3 h-3" />
          </Link>
        </footer>
      )}
    </div>
  );
}