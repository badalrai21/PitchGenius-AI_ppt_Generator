"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface BrandLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  fullscreen?: boolean;
  variant?: "default" | "minimal" | "inline";
}

const SIZE_MAP = {
  sm: { logo: "w-8 h-8", ring: "w-14 h-14", text: "text-xs" },
  md: { logo: "w-12 h-12", ring: "w-20 h-20", text: "text-sm" },
  lg: { logo: "w-16 h-16", ring: "w-28 h-28", text: "text-base" },
  xl: { logo: "w-20 h-20", ring: "w-36 h-36", text: "text-lg" },
};

export function BrandLoader({
  size = "md",
  label,
  fullscreen = false,
  variant = "default",
}: BrandLoaderProps) {
  const dims = SIZE_MAP[size];
  const [dynamicLabel, setDynamicLabel] = useState<string | undefined>(label);
  const supabase = createClient();

  useEffect(() => {
    if (label) {
      setDynamicLabel(label);
      return;
    }

    async function loadDefaultLabel() {
      try {
        const { data: settingData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "default_loading_label")
          .maybeSingle();

        if (settingData && settingData.value) {
          setDynamicLabel(settingData.value);
        }
      } catch (e) {
        console.warn("Could not load default loader label from settings:", e);
      }
    }

    loadDefaultLabel();
  }, [label, supabase]);

  const loader = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Outer rotating gradient ring */}
        <motion.div
          className={`absolute ${dims.ring} rounded-full`}
          style={{
            background:
              "conic-gradient(from 0deg, transparent, transparent 30%, #06b6d4 50%, #3b82f6 65%, #8b5cf6 80%, transparent 100%)",
            padding: "3px",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full rounded-full bg-white dark:bg-slate-950" />
        </motion.div>

        {/* Inner glow pulse */}
        <motion.div
          className={`absolute ${dims.ring} rounded-full`}
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.3), transparent 70%)",
            filter: "blur(15px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Center logo with subtle pulse */}
        <motion.div
          className={`relative ${dims.logo} flex items-center justify-center`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Logo className="w-full h-full" />
        </motion.div>
      </div>

      {dynamicLabel && (
        <motion.p
          className={`${dims.text} font-medium text-slate-600 dark:text-slate-400 tracking-wide text-center`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {dynamicLabel}
        </motion.p>
      )}
    </div>
  );

  if (variant === "inline") {
    return loader;
  }

  if (variant === "minimal") {
    return (
      <div className="relative flex items-center justify-center">
        <motion.div
          className={`absolute ${dims.ring} rounded-full`}
          style={{
            background:
              "conic-gradient(from 0deg, transparent, transparent 40%, #06b6d4 60%, #3b82f6 80%, transparent 100%)",
            padding: "2px",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full rounded-full bg-white dark:bg-slate-950" />
        </motion.div>
        <div className={`relative ${dims.logo} flex items-center justify-center`}>
          <Logo className="w-full h-full" />
        </div>
      </div>
    );
  }

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex items-center justify-center">
        {/* Ambient gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>
        <div className="relative">{loader}</div>
      </div>
    );
  }

  return (
    <div className="min-h-[300px] flex items-center justify-center">
      {loader}
    </div>
  );
}

// Compact inline spinner for buttons and small spaces
export function BrandSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <motion.div
      className={`${className} rounded-full`}
      style={{
        background: "conic-gradient(from 0deg, transparent, #06b6d4 40%, #3b82f6 70%, transparent 100%)",
        padding: "2px",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-full h-full rounded-full bg-white dark:bg-slate-950" />
    </motion.div>
  );
}