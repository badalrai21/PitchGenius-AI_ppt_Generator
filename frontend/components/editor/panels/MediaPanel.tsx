"use client";

import React, { useState, useEffect } from "react";
import { usePresentationStore } from "@/stores/usePresentationStore";
import { Sparkles, Loader2, Image as ImageIcon, Search, Check, Wand2, X, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ArtStyle {
  id: string;
  label: string;
  emoji: string;
  promptAdd: string;
}

const DEFAULT_ART_STYLES: ArtStyle[] = [
  { id: "photorealistic", label: "Photo", emoji: "📸", promptAdd: "highly detailed professional photography, shot on 35mm lens, corporate polished style, clean studio lighting" },
  { id: "vector", label: "Vector", emoji: "🎨", promptAdd: "clean minimalist vector illustration, flat design, modern business graphic, pastel background" },
  { id: "3d-render", label: "3D Render", emoji: "🔮", promptAdd: "premium claymation 3D render, blender model, soft shadows, vibrant studio lighting, clean solid background" },
  { id: "cyberpunk", label: "Neon", emoji: "🌌", promptAdd: "vibrant synthwave neon aesthetic, cyber tech, glowing vector elements, dark background" },
];

interface StockImage {
  url: string;
  thumb: string;
  photographer_name: string;
  photographer_profile: string;
  image_source: string;
}

export function MediaPanel() {
  const { slides, activeSlideIndex, updateSlide } = usePresentationStore();
  const activeSlide = slides[activeSlideIndex];
  const supabase = createClient();

  // Segmented control: "search" (Unsplash/Pexels) or "generate" (Hugging Face FLUX)
  const [activeTab, setActiveTab] = useState<"search" | "generate">("search");
  
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [artStyles, setArtStyles] = useState<ArtStyle[]>(DEFAULT_ART_STYLES);
  const [backendUrl, setBackendUrl] = useState<string>(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000");
  
  const [generating, setGenerating] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [stockResults, setStockResults] = useState<StockImage[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // ★ DYNAMIC STYLES & CONFIG FROM DATABASE
  useEffect(() => {
    async function loadDynamicConfig() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["art_styles", "backend_url"]);

        if (settings && settings.length > 0) {
          settings.forEach((s) => {
            if (s.key === "backend_url" && s.value) {
              setBackendUrl(s.value);
            }
            if (s.key === "art_styles" && s.value) {
              try {
                const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setArtStyles(parsed);
                }
              } catch (e) {
                console.warn("Could not parse art_styles config:", e);
              }
            }
          });
        }
      } catch (err) {
        console.warn("Failed to load DB config in MediaPanel:", err);
      }
    }

    loadDynamicConfig();
  }, [supabase]);

  // Load initial suggested stock search based on slide context
  useEffect(() => {
    if (activeSlide && !hasSearched) {
      const defaultQuery = (activeSlide as any).image_keyword || activeSlide.title || "business";
      setSearchQuery(defaultQuery);
      performSearch(defaultQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlideIndex]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/generate/search-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setStockResults(data.results);
        setHasSearched(true);
      }
    } catch (err: any) {
      console.error("Search error:", err);
      toast.error("Failed to load search results.");
    } finally {
      setSearching(false);
    }
  };

  const handleStockSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  // ★ Hugging Face AI Generation (FLUX.1)
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    const toastId = toast.loading("Hugging Face is painting your custom visual...");

    try {
      const selectedStyleData = artStyles.find((s) => s.id === selectedStyle);
      const enhancedPrompt = `${prompt.trim()}, ${selectedStyleData?.promptAdd || ""}`;

      const res = await fetch(`${backendUrl}/api/v1/generate/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: enhancedPrompt,
          use_ai_generation: true // ★ FORCE HUGGING FACE FLUX DIRECTLY
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.detail || "Generation failed");

      updateSlide(activeSlideIndex, {
        image_url: data.url,
        image_keyword: prompt.trim(),
        photographer_name: data.photographer_name || "AI Generated",
        photographer_profile: data.photographer_profile || "",
        image_source: data.image_source || "ai",
      } as any);

      toast.success("AI Image generated and applied!", { id: toastId, duration: 1500 });
      setPrompt("");
    } catch (err: any) {
      console.error("AI Generation error:", err);
      toast.error(err.message || "Hugging Face generation failed.", { id: toastId, duration: 2500 });
    } finally {
      setGenerating(false);
    }
  };

  // ★ Auto-Generate (Combines LLM Prompting + Hugging Face FLUX)
  const handleAutoGenerateImage = async () => {
    if (!activeSlide || autoGenerating) return;
    setAutoGenerating(true);
    const toastId = toast.loading("Analyzing slide context...");

    try {
      // 1. Get creative prompt from LLM
      const promptRes = await fetch(`${backendUrl}/api/v1/generate/suggest-image-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slide: {
            layout: activeSlide.layout,
            title: activeSlide.title,
            subtitle: activeSlide.subtitle || "",
            bullets: activeSlide.bullets || [],
            body: activeSlide.body || "",
          },
          art_style: selectedStyle,
        }),
      });

      const promptData = await promptRes.json();
      const suggestedPrompt = promptData.suggested_prompt || activeSlide.title;

      toast.loading(`Hugging Face generating: "${suggestedPrompt.substring(0, 35)}..."`, { id: toastId });

      // 2. Feed into FLUX.1
      const selectedStyleData = artStyles.find((s) => s.id === selectedStyle);
      const enhancedPrompt = `${suggestedPrompt}, ${selectedStyleData?.promptAdd || ""}`;

      const imageRes = await fetch(`${backendUrl}/api/v1/generate/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: enhancedPrompt, 
          use_ai_generation: true // ★ FORCE HUGGING FACE FLUX DIRECTLY
        }),
      });

      const imageData = await imageRes.json();
      if (!imageRes.ok || !imageData.url) throw new Error(imageData.detail || "Generation failed");

      // Apply
      updateSlide(activeSlideIndex, {
        image_url: imageData.url,
        image_keyword: suggestedPrompt,
        photographer_name: imageData.photographer_name || "AI Generated",
        photographer_profile: imageData.photographer_profile || "",
        image_source: imageData.image_source || "ai",
      } as any);

      toast.success("AI Visual generated and applied!", { id: toastId, duration: 1500 });
    } catch (err: any) {
      console.error("Auto-generate error:", err);
      toast.error("AI Generation failed. Check HuggingFace Token in backend.", { id: toastId, duration: 2500 });
    } finally {
      setAutoGenerating(false);
    }
  };

  const applyImageToSlide = (img: StockImage) => {
    updateSlide(activeSlideIndex, {
      image_url: img.url,
      image_keyword: searchQuery,
      photographer_name: img.photographer_name || "",
      photographer_profile: img.photographer_profile || "",
      image_source: img.image_source || "unsplash",
    } as any);
    toast.success("Image applied!", { duration: 1500 });
  };

  const removeSlideImage = () => {
    updateSlide(activeSlideIndex, {
      image_url: undefined,
      photographer_name: "",
      photographer_profile: "",
      image_source: "",
    } as any);
    toast.success("Image removed", { duration: 1500 });
  };

  return (
    <div className="space-y-5">
      {/* Active Slide Image indicator */}
      {(activeSlide as any)?.image_url && (
        <div className="p-3 rounded-2xl border border-cyan-100 dark:border-cyan-950/30 bg-cyan-500/[0.03] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-12 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
              <img src={(activeSlide as any).image_url} className="object-cover w-full h-full" alt="Current" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Current image</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {(activeSlide as any).photographer_name || (activeSlide as any).image_keyword || "Applied"}
              </p>
            </div>
          </div>
          <button
            onClick={removeSlideImage}
            className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors shrink-0"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Segmented Tab Switcher (Gamma Style) */}
      <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "search"
              ? "bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Stock Photos</span>
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "generate"
              ? "bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Generator</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: STOCK SEARCH MODE */}
        {activeTab === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <form onSubmit={handleStockSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Unsplash & Pexels..."
                className="w-full pl-9 pr-16 py-2.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-bold disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Search"}
              </button>
            </form>

            {searching ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : stockResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                {stockResults.map((img, idx) => {
                  const isApplied = (activeSlide as any)?.image_url === img.url;
                  return (
                    <div
                      key={idx}
                      onClick={() => applyImageToSlide(img)}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 cursor-pointer group transition-all ${
                        isApplied ? "border-cyan-500 shadow-md scale-95" : "border-transparent hover:border-cyan-500/50"
                      }`}
                    >
                      <img
                        src={img.thumb || img.url}
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                        alt={img.photographer_name}
                        onError={(e) => { (e.target as HTMLImageElement).src = img.url; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-end p-2">
                        <span className="text-[8px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                          By {img.photographer_name}
                        </span>
                      </div>
                      {isApplied && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Search high-quality stock photos</p>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: AI ART GENERATOR MODE */}
        {activeTab === "generate" && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Style Selector */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Art Style</p>
              <div className="grid grid-cols-4 gap-1.5">
                {artStyles.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`py-2 rounded-xl border text-center transition-all ${
                      selectedStyle === style.id
                        ? "border-cyan-500 bg-cyan-500/[0.05] text-cyan-600 dark:text-cyan-400 font-bold"
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 text-slate-500 dark:text-slate-400 text-xs"
                    }`}
                  >
                    <div className="text-sm mb-0.5">{style.emoji}</div>
                    <div className="text-[9px]">{style.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Auto Generate */}
            <button
              onClick={handleAutoGenerateImage}
              disabled={autoGenerating || !activeSlide}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-purple-500/20 hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all border-none"
            >
              {autoGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>FLUX painting visual...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Generate Slide Image</span>
                </>
              )}
            </button>

            <div className="relative flex items-center gap-4 py-1">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">or describe vision</span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Describe Prompt form */}
            <form onSubmit={handleGenerateImage} className="space-y-3">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Abstract clean 3D clay model of a computer server glowing with blue energy..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none text-slate-900 dark:text-white"
              />

              <button
                type="submit"
                disabled={generating || !prompt.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI is painting...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Generate custom art</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}