"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon, Home, ArrowLeft } from "lucide-react";
import { config } from "@/lib/config";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

interface AuthNavbarProps {
  ctaLabel?: string;
  ctaHref?: string;
}

export function AuthNavbar({ ctaLabel, ctaHref }: AuthNavbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [appName, setAppName] = useState<string>(config.app.name || "PitchGenius");
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);

    async function loadNavSettings() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .eq("key", "app_name")
          .maybeSingle();
        if (settings?.value) setAppName(settings.value);
      } catch (err) {
        console.warn("Failed to load navbar settings:", err);
      }
    }
    loadNavSettings();

    return () => window.removeEventListener("scroll", onScroll);
  }, [supabase]);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <nav className={`apple-nav ${scrolled ? "shadow-sm" : ""}`} style={{ position: "relative", zIndex: 20 }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Logo className="h-8 w-8 transition-transform group-hover:scale-105" />
            <span className="font-display font-semibold text-lg text-slate-900 dark:text-white">
              {appName}
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Back to landing page button */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && (
                isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )
              )}
            </button>

            {/* CTA button */}
            {ctaLabel && ctaHref && (
              <Link
                href={ctaHref}
                className="text-sm font-medium px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-transform"
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}