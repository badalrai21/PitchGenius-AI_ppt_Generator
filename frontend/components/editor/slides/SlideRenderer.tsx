"use client";

import { Slide, ThemeConfig } from "@/lib/types/database";
import {
  Sparkles, TrendingUp, Quote, Target, Lightbulb, ArrowRight,
  Zap, BarChart3, Globe, Shield, Rocket, Users, Award, Camera
} from "lucide-react";
import React, { useRef, useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface SlideRendererProps {
  slide: Slide;
  theme: ThemeConfig;
  isEditable?: boolean;
  onUpdate?: (updatedFields: Partial<Slide>) => void;
}

// ═══════════════════════════════════════════════════════════════
// DYNAMIC PHOTOGRAPHER ATTRIBUTION (API Guideline Compliant)
// ═══════════════════════════════════════════════════════════════
function PhotoAttribution({
  slide,
  textColor,
  utmSource = "pitchgenius",
}: {
  slide: any;
  textColor: string;
  utmSource?: string;
}) {
  const imageUrl = slide?.image_url;
  const photographerName = slide?.photographer_name;
  const photographerProfile = slide?.photographer_profile;
  const imageSource = slide?.image_source;

  if (
    !imageUrl ||
    typeof imageUrl !== "string" ||
    imageSource === "ai" ||
    imageSource === "picsum" ||
    !photographerName
  ) {
    return null;
  }

  const isUnsplash = imageSource === "unsplash" || imageUrl.includes("images.unsplash.com");
  const isPexels = imageSource === "pexels" || imageUrl.includes("images.pexels.com");

  if (!isUnsplash && !isPexels) return null;

  const platformName = isUnsplash ? "Unsplash" : "Pexels";
  const platformLink = isUnsplash
    ? `https://unsplash.com?utm_source=${utmSource}&utm_medium=referral`
    : `https://www.pexels.com?utm_source=${utmSource}&utm_medium=referral`;

  return (
    <div
      className="absolute bottom-2 right-3 z-20 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity pointer-events-auto"
      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
    >
      <Camera style={{ width: "8px", height: "8px", color: "#ffffff" }} />
      <span style={{ fontSize: "8px", color: "#ffffff" }}>
        Photo by{" "}
        {photographerProfile ? (
          <a
            href={photographerProfile}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
            style={{ color: "#ffffff" }}
          >
            {photographerName}
          </a>
        ) : (
          <span className="font-semibold">{photographerName}</span>
        )}
        {" on "}
        <a
          href={platformLink}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: "#ffffff" }}
        >
          {platformName}
        </a>
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// THEME-AWARE VISUAL STYLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════
function resolveStyle(visualStyle: string, theme: ThemeConfig) {
  const primary = theme?.primary || "#0077B6";

  const styles: Record<string, any> = {
    gradient: {
      overlay: "from-indigo-900/85 via-purple-900/75 to-pink-900/85",
      text: "#ffffff",
      sub: "rgba(255,255,255,0.9)",
      card: "rgba(255,255,255,0.15)",
      cardBorder: "rgba(255,255,255,0.25)",
      accent: "#67e8f9",
    },
    photo: {
      overlay: "from-black/75 via-black/60 to-black/80",
      text: "#ffffff",
      sub: "rgba(255,255,255,0.9)",
      card: "rgba(255,255,255,0.18)",
      cardBorder: "rgba(255,255,255,0.25)",
      accent: "#fbbf24",
    },
    abstract: {
      overlay: "from-cyan-900/85 via-blue-900/75 to-indigo-900/85",
      text: "#ffffff",
      sub: "rgba(255,255,255,0.9)",
      card: "rgba(255,255,255,0.15)",
      cardBorder: "rgba(255,255,255,0.2)",
      accent: "#22d3ee",
    },
    minimal: {
      overlay: "from-white/95 via-slate-50/92 to-white/95",
      text: "#0f172a",
      sub: "#334155",
      card: "rgba(15,23,42,0.08)",
      cardBorder: "rgba(15,23,42,0.15)",
      accent: primary,
    },
    dark: {
      overlay: "from-gray-950/92 via-slate-900/88 to-gray-950/92",
      text: "#f8fafc",
      sub: "rgba(248,250,252,0.85)",
      card: "rgba(255,255,255,0.1)",
      cardBorder: "rgba(255,255,255,0.18)",
      accent: "#38bdf8",
    },
    colorful: {
      overlay: "from-rose-900/85 via-orange-900/75 to-amber-900/85",
      text: "#ffffff",
      sub: "rgba(255,255,255,0.9)",
      card: "rgba(255,255,255,0.18)",
      cardBorder: "rgba(255,255,255,0.25)",
      accent: "#fde68a",
    },
  };

  const style = styles[visualStyle] || styles.gradient;

  if (theme?.primary) {
    style.accent = theme.primary;
  }

  return style;
}

const ICON_POOL = [Sparkles, Rocket, Zap, Globe, Shield, Award, Users, BarChart3, Target, Lightbulb];

export function SlideRenderer({ slide, theme, isEditable = true, onUpdate }: SlideRendererProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const [imgError, setImgError] = useState(false);

  // ★ DYNAMIC CONFIGURATION STATE (Zero hardcoding)
  const [appName, setAppName] = useState<string>("PitchGenius");
  const [utmSource, setUtmSource] = useState<string>("pitchgenius");
  const supabase = createClient();

  useEffect(() => {
    async function loadDynamicSettings() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["app_name", "utm_source"]);

        if (settings && settings.length > 0) {
          settings.forEach((s) => {
            if (s.key === "app_name" && s.value) {
              setAppName(s.value);
              setUtmSource(s.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
            }
            if (s.key === "utm_source" && s.value) {
              setUtmSource(s.value);
            }
          });
        }
      } catch (err) {
        console.warn("Failed to load dynamic settings in SlideRenderer:", err);
      }
    }

    loadDynamicSettings();
  }, [supabase]);

  if (!slide) return null;

  const handleTextChange = (field: keyof Slide, value: string) => {
    if (onUpdate && isEditable) onUpdate({ [field]: value });
  };

  const handleBulletChange = (idx: number, text: string) => {
    if (onUpdate && isEditable) {
      const b = [...(slide.bullets || [])];
      b[idx] = text;
      onUpdate({ bullets: b });
    }
  };

  const getBullets = (): string[] => {
    if (Array.isArray(slide.bullets) && slide.bullets.length > 0) return slide.bullets;
    if (slide.body?.includes("•")) return slide.body.split("•").map((s) => s.trim()).filter(Boolean);
    if (slide.body?.includes("\n")) return slide.body.split("\n").map((s) => s.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
    return slide.body ? [slide.body] : [];
  };

  const visualStyle = (slide as any).visual_style || "gradient";
  const imageKeyword = (slide as any).image_keyword || "abstract";
  const backendImage = (slide as any).image_url;
  const style = resolveStyle(visualStyle, theme);
  const SlideIcon = ICON_POOL[Math.abs(imageKeyword.length) % ICON_POOL.length];
  const slideIndex = (slide as any).index || 0;

  const imageUrl = useMemo(() => {
    if (imgError || !backendImage) {
      return `https://picsum.photos/seed/${slideIndex}-${imageKeyword.replace(/\s+/g, "-")}/1200/675`;
    }
    return backendImage;
  }, [backendImage, imgError, slideIndex, imageKeyword]);

  const strongShadow = "0 2px 20px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)";
  const mediumShadow = "0 1px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)";

  // ═════════ LAYOUT 1: TITLE ═════════
  if (slide.layout === "title") {
    return (
      <div className="w-full h-full relative overflow-hidden rounded-2xl select-text" style={{ color: style.text }}>
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
        <div className={`absolute inset-0 bg-gradient-to-br ${style.overlay}`} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/[0.04] blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="relative z-10 h-full flex flex-col justify-center p-10 md:p-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border mb-6" style={{ backgroundColor: style.card, borderColor: style.cardBorder }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: style.accent }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: style.text, textShadow: mediumShadow }}>
                {appName} AI
              </span>
            </div>
            <h1 ref={titleRef} contentEditable={isEditable} suppressContentEditableWarning onBlur={(e) => handleTextChange("title", e.currentTarget.innerText)} className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-[1.05] mb-4 outline-none" style={{ color: style.text, textShadow: strongShadow }}>
              {slide.title}
            </h1>
            <div className="w-16 h-1 rounded-full mb-4" style={{ backgroundColor: style.accent }} />
            {slide.subtitle && (
              <p ref={subtitleRef} contentEditable={isEditable} suppressContentEditableWarning onBlur={(e) => handleTextChange("subtitle", e.currentTarget.innerText)} className="text-lg md:text-xl font-light leading-relaxed max-w-xl outline-none" style={{ color: style.text, textShadow: mediumShadow, opacity: 0.95 }}>
                {slide.subtitle}
              </p>
            )}
          </div>
        </div>
        <PhotoAttribution slide={slide} textColor={style.text} utmSource={utmSource} />
      </div>
    );
  }

  // ═════════ LAYOUT 2: BULLETS ═════════
  if (slide.layout === "bullets") {
    const bullets = getBullets();
    return (
      <div className="w-full h-full relative overflow-hidden rounded-2xl select-text" style={{ color: style.text }}>
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
        <div className={`absolute inset-0 bg-gradient-to-r ${style.overlay}`} />

        <div className="relative z-10 h-full flex flex-col p-10 md:p-14">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: style.card, border: `1px solid ${style.cardBorder}` }}>
                <SlideIcon className="w-4 h-4" style={{ color: style.accent }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: style.accent, textShadow: mediumShadow }}>Key Insights</span>
            </div>
            <h2 ref={titleRef} contentEditable={isEditable} suppressContentEditableWarning onBlur={(e) => handleTextChange("title", e.currentTarget.innerText)} className="text-2xl md:text-4xl font-bold font-display tracking-tight outline-none" style={{ color: style.text, textShadow: strongShadow }}>
              {slide.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
            {bullets.slice(0, 4).map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl backdrop-blur-md" style={{ backgroundColor: style.card, border: `1px solid ${style.cardBorder}` }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-lg" style={{ background: `linear-gradient(135deg, ${style.accent}, ${theme?.secondary || "#0077B6"})` }}>
                  {idx + 1}
                </div>
                <p contentEditable={isEditable} suppressContentEditableWarning onBlur={(e) => handleBulletChange(idx, e.currentTarget.innerText)} className="text-sm md:text-base leading-relaxed outline-none flex-1 font-medium" style={{ color: style.text, textShadow: mediumShadow }}>
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </div>
        <PhotoAttribution slide={slide} textColor={style.text} utmSource={utmSource} />
      </div>
    );
  }

  // ═════════ LAYOUT 3: TWO COLUMN ═════════
  if (slide.layout === "two_column") {
    const leftPts = slide.left_column?.points || [];
    const rightPts = slide.right_column?.points || [];
    return (
      <div className="w-full h-full relative overflow-hidden rounded-2xl select-text" style={{ color: style.text }}>
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
        <div className={`absolute inset-0 bg-gradient-to-br ${style.overlay}`} />
        <div className="relative z-10 h-full flex flex-col p-10 md:p-14">
          <h2 ref={titleRef} contentEditable={isEditable} suppressContentEditableWarning onBlur={(e) => handleTextChange("title", e.currentTarget.innerText)} className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-6 outline-none" style={{ color: style.text, textShadow: strongShadow }}>
            {slide.title}
          </h2>
          <div className="grid grid-cols-2 gap-5 flex-1">
            <div className="p-5 rounded-2xl backdrop-blur-md" style={{ backgroundColor: style.card, border: `1px solid ${style.cardBorder}` }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-rose-500/40 flex items-center justify-center"><Target className="w-3.5 h-3.5 text-white" /></div>
                <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ textShadow: mediumShadow }}>{slide.left_column?.title || "Current"}</span>
              </div>
              <ul className="space-y-3">
                {leftPts.slice(0, 4).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                    <span className="leading-relaxed" style={{ color: style.text, textShadow: mediumShadow, opacity: 0.95 }}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-2xl backdrop-blur-md" style={{ backgroundColor: style.card, border: `1px solid ${style.cardBorder}` }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/40 flex items-center justify-center"><Lightbulb className="w-3.5 h-3.5 text-white" /></div>
                <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ textShadow: mediumShadow }}>{slide.right_column?.title || "Solution"}</span>
              </div>
              <ul className="space-y-3">
                {rightPts.slice(0, 4).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5"><ArrowRight className="w-3 h-3 text-white" /></div>
                    <span className="leading-relaxed" style={{ color: style.text, textShadow: mediumShadow, opacity: 0.95 }}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <PhotoAttribution slide={slide} textColor={style.text} utmSource={utmSource} />
      </div>
    );
  }

  // ═════════ LAYOUT 4: METRICS ═════════
  if (slide.layout === "metrics") {
    const metrics = slide.metrics || [];
    const metricColors = ["#22d3ee", "#c084fc", "#34d399", "#fbbf24"];
    const metricBgs = ["rgba(34,211,238,0.2)", "rgba(192,132,252,0.2)", "rgba(52,211,153,0.2)", "rgba(251,191,36,0.2)"];
    return (
      <div className="w-full h-full relative overflow-hidden rounded-2xl select-text" style={{ color: style.text }}>
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
        <div className={`absolute inset-0 bg-gradient-to-br ${style.overlay}`} />
        <div className="relative z-10 h-full flex flex-col p-10 md:p-14">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: style.accent }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: style.accent, textShadow: mediumShadow }}>Performance</span>
          </div>
          <h2 ref={titleRef} contentEditable={isEditable} suppressContentEditableWarning onBlur={(e) => handleTextChange("title", e.currentTarget.innerText)} className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-6 outline-none" style={{ color: style.text, textShadow: strongShadow }}>
            {slide.title}
          </h2>
          <div className="grid grid-cols-3 gap-4 flex-1 items-center">
            {metrics.slice(0, 3).map((m, i) => (
              <div key={i} className="p-6 rounded-2xl backdrop-blur-md text-center" style={{ backgroundColor: metricBgs[i % metricBgs.length], border: `1px solid ${style.cardBorder}` }}>
                <div className="text-4xl md:text-5xl font-black font-display tracking-tight mb-2" style={{ color: metricColors[i % metricColors.length], textShadow: `0 0 30px ${metricColors[i % metricColors.length]}80, 0 2px 15px rgba(0,0,0,0.7)` }}>
                  {m.value}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: style.text, textShadow: mediumShadow }}>{m.label}</p>
                {m.desc && <p className="text-[10px] mt-1" style={{ color: style.text, textShadow: mediumShadow, opacity: 0.85 }}>{m.desc}</p>}
              </div>
            ))}
          </div>
        </div>
        <PhotoAttribution slide={slide} textColor={style.text} utmSource={utmSource} />
      </div>
    );
  }

  // ═════════ LAYOUT 5: QUOTE ═════════
  if (slide.layout === "quote") {
    return (
      <div className="w-full h-full relative overflow-hidden rounded-2xl select-text" style={{ color: style.text }}>
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
        <div className={`absolute inset-0 bg-gradient-to-br ${style.overlay}`} />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center">
          <div className="w-14 h-14 rounded-2xl backdrop-blur-md flex items-center justify-center mb-6" style={{ backgroundColor: style.card, border: `1px solid ${style.cardBorder}` }}>
            <Quote className="w-7 h-7" style={{ color: style.accent }} strokeWidth={1.5} />
          </div>
          <blockquote ref={quoteRef} contentEditable={isEditable} suppressContentEditableWarning onBlur={(e) => handleTextChange("quote", e.currentTarget.innerText)} className="text-xl md:text-3xl font-light font-display leading-relaxed tracking-tight max-w-2xl italic outline-none mb-6" style={{ color: style.text, textShadow: strongShadow }}>
            &ldquo;{slide.quote || slide.body || "The best way to predict the future is to create it."}&rdquo;
          </blockquote>
          <div className="w-12 h-[2px] mb-4" style={{ background: `linear-gradient(90deg, ${style.accent}, ${theme?.secondary || "#c084fc"})` }} />
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: style.text, textShadow: mediumShadow, opacity: 0.9 }}>
            — {slide.quote_author || "Visionary Leader"}
          </p>
        </div>
        <PhotoAttribution slide={slide} textColor={style.text} utmSource={utmSource} />
      </div>
    );
  }

  // ═════════ DEFAULT ═════════
  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl select-text" style={{ color: style.text }}>
      <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
      <div className={`absolute inset-0 bg-gradient-to-br ${style.overlay}`} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-3xl font-bold font-display" style={{ color: style.text, textShadow: strongShadow }}>{slide.title}</h2>
        {slide.subtitle && <p className="text-lg mt-3" style={{ color: style.text, textShadow: mediumShadow, opacity: 0.9 }}>{slide.subtitle}</p>}
      </div>
      <PhotoAttribution slide={slide} textColor={style.text} utmSource={utmSource} />
    </div>
  );
}