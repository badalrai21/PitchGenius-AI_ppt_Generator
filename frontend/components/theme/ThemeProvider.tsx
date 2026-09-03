"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextType {
  theme: ResolvedTheme;
  mode: ThemeMode;
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const defaultContext: ThemeContextType = {
  theme: "light",
  mode: "system",
  themeMode: "system",
  resolvedTheme: "light",
  isDark: false,
  setMode: () => {},
  setThemeMode: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

const STORAGE_KEY = "pitchgenius-theme-mode";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return getSystemTheme();
  return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);
  const [themeColors, setThemeColors] = useState({
    dark: "#030712",
    light: "#ffffff",
  });

  const supabase = createClient();

  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    setResolvedTheme(resolved);
    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        resolved === "dark" ? themeColors.dark : themeColors.light
      );
    }
  }, [themeColors]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initialMode = saved || "system";
    setModeState(initialMode);
    const resolved = resolveTheme(initialMode);
    applyTheme(resolved);

    async function loadThemeSettings() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["theme_meta_dark", "theme_meta_light"]);

        if (settings && settings.length > 0) {
          const colorsUpdate: any = {};
          settings.forEach((s) => {
            if (s.key === "theme_meta_dark" && s.value) colorsUpdate.dark = s.value;
            if (s.key === "theme_meta_light" && s.value) colorsUpdate.light = s.value;
          });
          setThemeColors((prev) => ({ ...prev, ...colorsUpdate }));
        }
      } catch (err) {
        console.warn("Theme settings load warning:", err);
      }
    }

    loadThemeSettings();
  }, [applyTheme, supabase]);

  useEffect(() => {
    if (!mounted) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (mode === "system") {
        const resolved = getSystemTheme();
        applyTheme(resolved);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode, mounted, applyTheme]);

  useEffect(() => {
    if (!mounted) return;
    const resolved = resolveTheme(mode);
    applyTheme(resolved);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, mounted, applyTheme]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const currentlyDisplayed = resolveTheme(prev);
      return currentlyDisplayed === "dark" ? "light" : "dark";
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        mode,
        themeMode: mode,
        resolvedTheme,
        isDark: resolvedTheme === "dark",
        setMode,
        setThemeMode: setMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}