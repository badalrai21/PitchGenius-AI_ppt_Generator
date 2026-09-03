"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Edit3, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DeckPreviewProps {
  deck: {
    id: string;
    title: string;
    slide_count: number;
    created_at: string;
    updated_at?: string;
    status?: string;
    slides_data?: any[];
    custom_theme?: any;
  };
}

export function DashboardDeckPreview({ deck }: DeckPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [defaultColors, setDefaultColors] = useState({
    primary: "#0077B6",
    secondary: "#1D1D1F",
    bg: "#0f172a"
  });

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);

    async function loadFallbackColors() {
      try {
        // ★ DYNAMIC FALLBACK COLORS: Load branding defaults from DB if deck custom_theme is empty
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["primary_color", "secondary_color", "default_dark_bg"]);

        if (settings && settings.length > 0) {
          const colorsUpdate: any = {};
          settings.forEach((s) => {
            if (s.key === "primary_color" && s.value) colorsUpdate.primary = s.value;
            if (s.key === "secondary_color" && s.value) colorsUpdate.secondary = s.value;
            if (s.key === "default_dark_bg" && s.value) colorsUpdate.bg = s.value;
          });
          setDefaultColors((prev) => ({ ...prev, ...colorsUpdate }));
        }
      } catch (err) {
        console.warn("Error resolving fallback preview colors from settings:", err);
      }
    }

    loadFallbackColors();
  }, [supabase]);

  const firstSlide = deck.slides_data && deck.slides_data.length > 0 ? deck.slides_data[0] : null;
  const theme = deck.custom_theme || {};
  const primary = theme.primary || defaultColors.primary;
  const secondary = theme.secondary || defaultColors.secondary;

  const slideImageUrl = firstSlide?.image_url || null;
  const slideTitle = firstSlide?.title || deck.title || "Untitled";
  const slideLayout = firstSlide?.layout || "title";

  const gradientStyle = {
    background: `linear-gradient(135deg, ${primary}, ${secondary})`,
  };

  return (
    <div className="apple-card group flex flex-col overflow-hidden border border-slate-200/60 dark:border-slate-800/60 hover:shadow-lg transition-all">
      {/* Thumbnail */}
      <Link
        href={`/editor/${deck.id}`}
        className="block aspect-[16/10] relative overflow-hidden"
        style={gradientStyle}
      >
        {/* Real slide image if available */}
        {mounted && slideImageUrl && typeof slideImageUrl === "string" && (
          <img
            src={slideImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Slide content preview (text only, no SlideRenderer to avoid hydration issues) */}
        <div className="absolute inset-0 flex flex-col justify-center p-5 z-10">
          <p className="text-white text-sm md:text-base font-bold font-display line-clamp-2 leading-tight" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
            {slideTitle}
          </p>
          {firstSlide?.subtitle && (
            <p className="text-white/70 text-[10px] mt-1 line-clamp-1" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
              {firstSlide.subtitle}
            </p>
          )}
        </div>

        {/* Top-left badge */}
        <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
          <div className="w-1 h-1 rounded-full bg-white" />
          {deck.slide_count || 0} slides
        </div>

        {/* AI badge */}
        <div className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-widest">
          <Sparkles className="w-2.5 h-2.5" />
          AI
        </div>

        {/* Layout badge */}
        <div className="absolute bottom-3 left-3 z-20 text-[9px] font-bold text-white/60 uppercase tracking-wider">
          {slideLayout}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors z-10" />
      </Link>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="min-w-0 pr-3">
          <Link
            href={`/editor/${deck.id}`}
            className="font-bold text-sm text-slate-900 dark:text-white truncate block hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            {deck.title || "Untitled"}
          </Link>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {new Date(deck.updated_at || deck.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/dashboard/analytics/${deck.id}`}
            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-500 hover:text-cyan-600 flex items-center justify-center transition-colors"
            title="Analytics"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
          <Link
            href={`/editor/${deck.id}`}
            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-500 hover:text-cyan-600 flex items-center justify-center transition-colors"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}