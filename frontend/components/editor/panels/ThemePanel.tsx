"use client";

import React, { useState, useEffect } from "react";
import { usePresentationStore } from "@/stores/usePresentationStore";
import { ThemeConfig } from "@/lib/types/database";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ThemeOption {
  slug: string;
  name: string;
  gradient: string;
  config: ThemeConfig;
}

const FALLBACK_THEMES: ThemeOption[] = [
  {
    slug: "apple-executive",
    name: "Apple Studio",
    gradient: "linear-gradient(135deg, #0077B6, #1D1D1F)",
    config: {
      primary: "#0077B6",
      secondary: "#1D1D1F",
      accent: "#86868B",
      bg: "#FFFFFF",
      text: "#1D1D1F",
      muted: "#86868B",
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      gradient: "linear-gradient(135deg, #0077B6 0%, #1D1D1F 100%)",
    },
  },
  {
    slug: "space-gray",
    name: "Space Black",
    gradient: "linear-gradient(135deg, #161617, #2C2C2E, #0A84FF)",
    config: {
      primary: "#0A84FF",
      secondary: "#3A3A3C",
      accent: "#8E8E93",
      bg: "#161617",
      text: "#F5F5F7",
      muted: "#8E8E93",
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      gradient: "linear-gradient(135deg, #161617 0%, #2C2C2E 100%)",
    },
  },
  {
    slug: "silver-metallic",
    name: "Silver Metallic",
    gradient: "linear-gradient(135deg, #E5E5EA, #8E8E93, #1D1D1F)",
    config: {
      primary: "#1D1D1F",
      secondary: "#636366",
      accent: "#0077B6",
      bg: "#F5F5F7",
      text: "#1D1D1F",
      muted: "#636366",
      headingFont: "Inter",
      bodyFont: "Inter",
      gradient: "linear-gradient(135deg, #E5E5EA 0%, #F5F5F7 100%)",
    },
  },
  {
    slug: "deep-ocean-slate",
    name: "Midnight Slate",
    gradient: "linear-gradient(135deg, #0B192C, #1E3E62, #0077B6)",
    config: {
      primary: "#0077B6",
      secondary: "#1E3E62",
      accent: "#60A5FA",
      bg: "#0B192C",
      text: "#F5F5F7",
      muted: "#86868B",
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      gradient: "linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)",
    },
  },
];

export function ThemePanel() {
  const { themeSlug, setTheme } = usePresentationStore();
  const [themes, setThemes] = useState<ThemeOption[]>(FALLBACK_THEMES);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // ★ DYNAMIC THEME INGESTION: Query live themes and templates from DB
  useEffect(() => {
    async function loadThemesFromDB() {
      try {
        const { data: dbTemplates, error } = await supabase
          .from("templates")
          .select("slug, name, colors, theme_config")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (!error && dbTemplates && dbTemplates.length > 0) {
          const mapped: ThemeOption[] = dbTemplates.map((t) => {
            const rawConfig = t.theme_config || t.colors || {};
            const primary = rawConfig.primary || "#0077B6";
            const secondary = rawConfig.secondary || "#1D1D1F";
            const gradient = rawConfig.gradient || `linear-gradient(135deg, ${primary}, ${secondary})`;

            return {
              slug: t.slug,
              name: t.name,
              gradient: gradient,
              config: {
                primary: primary,
                secondary: secondary,
                accent: rawConfig.accent || "#86868B",
                bg: rawConfig.bg || "#FFFFFF",
                text: rawConfig.text || "#1D1D1F",
                muted: rawConfig.muted || "#86868B",
                headingFont: rawConfig.headingFont || "Space Grotesk",
                bodyFont: rawConfig.bodyFont || "Inter",
                gradient: gradient,
              },
            };
          });

          setThemes(mapped);
        }
      } catch (err) {
        console.warn("Using fallback theme presets:", err);
      } finally {
        setLoading(false);
      }
    }

    loadThemesFromDB();
  }, [supabase]);

  if (loading && themes.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => {
          const isSelected = themeSlug === theme.slug;
          return (
            <button
              key={theme.slug}
              onClick={() => setTheme(theme.config, theme.slug)}
              className={`apple-card p-3 text-left border flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                isSelected
                  ? "border-cyan-500 bg-cyan-500/[0.01]"
                  : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200"
              }`}
            >
              {/* Soft Ambient Vector Orb behind selection */}
              {isSelected && (
                <div
                  className="absolute -right-6 -bottom-6 w-14 h-14 rounded-full filter blur-lg opacity-20"
                  style={{ backgroundColor: theme.config.primary }}
                />
              )}

              <div className="relative z-10 w-full">
                {/* Horizontal Gradient Preview bar */}
                <div
                  className="h-10 rounded-xl mb-3 shadow-sm relative overflow-hidden"
                  style={{ background: theme.gradient }}
                >
                  <div className="absolute inset-0 bg-black/[0.03]" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                      {theme.name}
                    </div>
                    {/* Circle Swatches */}
                    <div className="flex gap-1 mt-1.5">
                      <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: theme.config.bg }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.config.primary }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.config.accent }} />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}