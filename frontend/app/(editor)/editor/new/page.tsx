"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileText, AlignLeft, ArrowLeft, Layers, Globe,
  Check, CloudUpload, Wand2, X, File, ArrowRight, Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { usePresentationStore, DEFAULT_THEME } from "@/stores/usePresentationStore";
import { toast } from "sonner";
import { QuotaExceededModal } from "@/components/dashboard/QuotaExceededModal";
import { isOverQuota, getPlanLimit, loadPlanLimitsFromDB } from "@/lib/quota";
import { config } from "@/lib/config";

type CreationMode = "prompt" | "document" | "text";

const DB_FALLBACK_LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Dutch", "Japanese", "Chinese", "Korean", "Hindi",
];

const DB_FALLBACK_ART_STYLES = [
  { value: "modern", label: "Modern", desc: "Clean & minimal" },
  { value: "corporate", label: "Corporate", desc: "Executive polished" },
  { value: "playful", label: "Playful", desc: "Vibrant & fun" },
  { value: "editorial", label: "Editorial", desc: "Magazine-style" },
];

const DB_FALLBACK_STAGES = [
  "Analyzing your inputs & context...",
  "Generating creative presentation outline...",
  "Writing punchy slide headlines & body copy...",
  "Applying dynamic design layouts...",
  "Sourcing contextual AI visuals...",
  "Polishing final presentation...",
];

const DB_FALLBACK_PROMPT_EXAMPLES = [
  "AI startup pitch deck for Series A investors",
  "Q4 product launch strategy for consumer app",
  "Climate change research summary with data",
  "Marketing playbook for a SaaS company 2025",
];

const MODE_OPTIONS = [
  { id: "prompt" as CreationMode, icon: Sparkles, title: "Text Prompt", desc: "Describe your idea in a sentence", color: "from-pink-500 to-rose-500", glowColor: "rgba(236,72,153,0.15)" },
  { id: "document" as CreationMode, icon: FileText, title: "Import File", desc: "PDF, Word, or TXT", color: "from-cyan-500 to-blue-600", glowColor: "rgba(0,119,182,0.15)" },
  { id: "text" as CreationMode, icon: AlignLeft, title: "Paste Text", desc: "Raw notes or markdown", color: "from-purple-500 to-indigo-600", glowColor: "rgba(139,92,246,0.15)" },
];

export default function NewPresentationPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<CreationMode>("prompt");
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("English");
  const [slideCount, setSlideCount] = useState(8);
  const [artStyle, setArtStyle] = useState("modern");
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [checkingQuota, setCheckingQuota] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const [availableLanguages, setAvailableLanguages] = useState<string[]>(DB_FALLBACK_LANGUAGES);
  const [availableArtStyles, setAvailableArtStyles] = useState(DB_FALLBACK_ART_STYLES);
  const [stages, setStages] = useState<string[]>(DB_FALLBACK_STAGES);
  const [promptExamples, setPromptExamples] = useState<string[]>(DB_FALLBACK_PROMPT_EXAMPLES);
  const [appName, setAppName] = useState(config.app.name || "PitchGenius");

  const setPresentation = usePresentationStore((state) => state.setPresentation);

  useEffect(() => {
    setMounted(true);

    async function initializePage() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await loadPlanLimitsFromDB();

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, plan, ppt_count_month")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          if (isOverQuota(profile.plan || "free", profile.ppt_count_month || 0)) {
            setShowQuotaModal(true);
          }
        }

        const { data: settingsData } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["supported_languages", "available_art_styles", "generation_stages", "prompt_examples", "app_name"]);

        if (settingsData && settingsData.length > 0) {
          settingsData.forEach((setting) => {
            try {
              const parsed = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
              if (setting.key === "supported_languages" && Array.isArray(parsed) && parsed.length > 0) setAvailableLanguages(parsed);
              if (setting.key === "available_art_styles" && Array.isArray(parsed) && parsed.length > 0) setAvailableArtStyles(parsed);
              if (setting.key === "generation_stages" && Array.isArray(parsed) && parsed.length > 0) setStages(parsed);
              if (setting.key === "prompt_examples" && Array.isArray(parsed) && parsed.length > 0) setPromptExamples(parsed);
            } catch {}
            if (setting.key === "app_name" && setting.value) setAppName(setting.value);
          });
        }
      } catch (err) {
        console.warn("[NewPresentation] Init warning:", err);
      } finally {
        setCheckingQuota(false);
      }
    }

    initializePage();
  }, [supabase]);

  const availableSlideCounts = useMemo(() => {
    const userPlan = userProfile?.plan || "free";
    const planLimit = getPlanLimit(userPlan);
    const maxAllowed = planLimit.maxSlidesPerDeck || 10;
    return [5, 8, 10, 12, 15, 20, 30, 50].filter((count) => count <= maxAllowed);
  }, [userProfile]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(interval);
  }, [loading, stages.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const maxBytes = (config.limits?.maxUploadSizeMB || 15) * 1024 * 1024;
      if (selected.size > maxBytes) {
        toast.error(`File exceeds ${config.limits?.maxUploadSizeMB || 15}MB limit.`);
        return;
      }
      setFile(selected);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      const maxBytes = (config.limits?.maxUploadSizeMB || 15) * 1024 * 1024;
      if (selected.size > maxBytes) {
        toast.error(`File exceeds ${config.limits?.maxUploadSizeMB || 15}MB limit.`);
        return;
      }
      setFile(selected);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userProfile && isOverQuota(userProfile.plan || "free", userProfile.ppt_count_month || 0)) {
      setShowQuotaModal(true);
      return;
    }

    setLoading(true);
    setCurrentStage(0);

    setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();

        if (!user) {
          toast.error("Please log in to continue.");
          router.push("/login");
          return;
        }

        const backendUrl = config.app.backendUrl || "http://localhost:8000";
        let res;

        if (mode === "prompt") {
          res = await fetch(`${backendUrl}/api/v1/generate/prompt`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
            },
            body: JSON.stringify({
              prompt: prompt.trim(),
              language,
              slide_count: slideCount,
              art_style: artStyle,
              user_id: user.id,
            }),
          });
        } else {
          const formData = new FormData();
          formData.append("language", language);
          formData.append("slide_count", slideCount.toString());
          formData.append("art_style", artStyle);
          formData.append("user_id", user.id);
          formData.append("analysis_depth", "deep");
          formData.append("instructions", 
            "Analyze the ENTIRE document content thoroughly. " +
            "Extract key insights, data points, statistics, arguments, and conclusions. " +
            "Create detailed slides with rich body content, bullet points with real data from the document, " +
            "meaningful metrics if available, and proper two-column comparisons where relevant. " +
            "Do NOT just use section headings as slide titles with empty bodies. " +
            "Each slide must have substantive content extracted from the document."
          );

          if (mode === "document" && file) {
            formData.append("file", file);
          } else if (mode === "text") {
            const textBlob = new Blob([text], { type: "text/plain" });
            formData.append("file", textBlob, "context.txt");
          }

          res = await fetch(`${backendUrl}/api/v1/generate/document`, {
            method: "POST",
            headers: {
              ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
            },
            body: formData,
          });
        }

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Generation failed. Please try again.");
        }

        let presentationId = data.id;
        if (!presentationId) {
          const { data: inserted, error: insertError } = await supabase
            .from("presentations")
            .insert({
              user_id: user.id,
              title: data.title || prompt.slice(0, 60) || file?.name?.replace(/\.[^/.]+$/, "") || "Untitled Presentation",
              prompt: prompt.trim() || null,
              language,
              art_style: artStyle,
              slides_data: data.slides_data || data.slides || [],
              slide_count: (data.slides_data || data.slides || []).length,
              status: "completed",
              source_type: mode === "text" ? "text" : mode === "document" ? "document" : "prompt",
              source_content: mode === "text" ? text.slice(0, 5000) : null,
              custom_theme: data.custom_theme || DEFAULT_THEME,
            })
            .select()
            .single();

          if (insertError) throw new Error("Failed to save: " + insertError.message);
          presentationId = inserted.id;
        }

        setPresentation({
          id: presentationId,
          title: data.title || "Untitled Presentation",
          slides: data.slides_data || data.slides || [],
          theme: data.custom_theme || DEFAULT_THEME,
          themeSlug: "apple-studio",
          artStyle: data.art_style || artStyle,
        });

        toast.success("Presentation generated successfully!");
        router.refresh();
        router.push(`/editor/${presentationId}`);
      } catch (err: any) {
        toast.error(err.message || "An unexpected generation issue occurred.");
        setLoading(false);
      }
    }, 50);
  };

  const canGenerate = () => {
    if (mode === "prompt") return prompt.trim().length > 5;
    if (mode === "document") return file !== null;
    if (mode === "text") return text.trim().length > 20;
    return false;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative font-sans">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(0,119,182,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.05) 0%, transparent 60%), linear-gradient(180deg, #fafbff 0%, #ffffff 100%)"
        }} />
        <div className="absolute inset-0 hidden dark:block" style={{
          background: "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(0,119,182,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.08) 0%, transparent 60%), linear-gradient(180deg, #030712 0%, #0a0f1e 100%)"
        }} />
      </div>

      {/* Header */}
      <header className="border-b border-slate-100/80 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl backdrop-saturate-150 h-14 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group text-decoration-none">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-slate-400 hidden sm:block">Back</span>
          </Link>

          <Link href="/" className="flex items-center gap-2 group text-decoration-none">
            <Logo className="h-7 w-7" />
            <span className="font-display font-semibold text-sm text-slate-900 dark:text-white tracking-tight">{appName}</span>
          </Link>

          <div className="w-20" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <AnimatePresence>
          {!loading ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10"
            >
              {/* Heading */}
              <div className="text-center max-w-xl mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-700 dark:text-cyan-400 font-sans">AI Presentation Studio</span>
                  </div>
                </div>
                <h1 className="hero-heading text-4xl md:text-5xl text-slate-900 dark:text-white mb-4 leading-[1.05] tracking-tight">
                  What are we{" "}
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #0071e3 0%, #af52de 50%, #ff375f 100%)" }}>
                    presenting?
                  </span>
                </h1>
                <p className="text-base text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                  Choose your starting point and let AI craft your deck in seconds.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODE_OPTIONS.map((item) => {
                  const isActive = mode === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setMode(item.id)}
                      className={`relative p-5 text-left rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isActive
                          ? "border-cyan-500/60 shadow-lg shadow-cyan-500/10"
                          : "border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mb-4 transition-all ${
                          isActive ? `bg-gradient-to-br ${item.color} text-white shadow-lg` : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{item.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Input Card */}
              <div className="relative rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl" style={{ boxShadow: "0 20px 60px -20px rgba(0,0,0,0.1)" }}>
                <form onSubmit={handleGenerate} className="p-6 md:p-8 space-y-6">
                  <AnimatePresence mode="wait">
                    {/* PROMPT */}
                    {mode === "prompt" && (
                      <motion.div key="prompt" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Presentation Topic</label>
                        <div className="relative">
                          <textarea required rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A Series A pitch for a clean-energy startup..."
                            className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none transition-all" />
                          <div className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-400">{prompt.length} chars</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mr-1 mt-1">Try:</span>
                          {promptExamples.map((ex) => (
                            <button key={ex} type="button" onClick={() => setPrompt(ex)} className="text-[11px] px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500/10 hover:text-cyan-600 text-slate-600 dark:text-slate-300 transition-all border border-transparent hover:border-cyan-500/30">
                              {ex}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* DOCUMENT */}
                    {mode === "document" && (
                      <motion.div key="doc" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Upload Source Document</label>

                        {file ? (
                          <div className="border-2 border-cyan-500 rounded-2xl p-8 text-center bg-cyan-500/[0.03]">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center mx-auto mb-4">
                              <File className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                              <File className="w-3.5 h-3.5" />
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to analyze
                            </p>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-all border-none"
                            >
                              <X className="w-3 h-3" /> Remove file
                            </button>
                          </div>
                        ) : (
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-10 text-center relative cursor-pointer transition-all group ${
                              isDragOver
                                ? "border-cyan-400 bg-cyan-500/[0.05] scale-[1.01]"
                                : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-cyan-500/50"
                            }`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.docx,.txt,.md"
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                              <CloudUpload className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                              {isDragOver ? "Drop your file here" : "Drag & drop or click to browse"}
                            </p>
                            <p className="text-xs text-slate-500">
                              PDF, Word, TXT · Max {config.limits?.maxUploadSizeMB || 15}MB · Up to {config.limits?.maxPdfPages || 35} pages
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* TEXT */}
                    {mode === "text" && (
                      <motion.div key="text" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                        <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Paste Your Content</label>
                        <div className="relative">
                          <textarea required rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your notes, meeting summary, research, or any raw text..."
                            className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-mono resize-none transition-all" />
                          <div className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-400">{text.length} chars</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Configuration */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 space-y-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Configuration</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Slides</label>
                        <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                          {availableSlideCounts.map((count) => (
                            <button key={count} type="button" onClick={() => setSlideCount(count)} className={`flex-1 min-w-[36px] py-2 rounded-xl text-xs font-bold transition-all ${slideCount === count ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
                              {count}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Language</label>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-none text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer">
                          {availableLanguages.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Art Style</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {availableArtStyles.map((style) => {
                          const isActive = artStyle === style.value;
                          return (
                            <button key={style.value} type="button" onClick={() => setArtStyle(style.value)} className={`p-3 rounded-2xl border text-left transition-all ${isActive ? "border-cyan-500/60 bg-cyan-500/[0.03] shadow-sm" : "border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                              <div className={`text-xs font-bold mb-0.5 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"}`}>{style.label}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{style.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!canGenerate()}
                    className="w-full group relative py-4 rounded-2xl text-sm font-bold text-white overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{
                      background: canGenerate() ? "linear-gradient(135deg, #0071e3 0%, #0077B6 50%, #af52de 100%)" : "#94a3b8",
                      boxShadow: canGenerate() ? "0 8px 30px -6px rgba(0,113,227,0.5), inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
                    }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative flex items-center justify-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Presentation</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* ═══════════ GENERATION WIZARD (ALL MODES) ═══════════ */
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md mx-auto text-center space-y-8 py-16"
            >
              {/* Spinner */}
              <div className="relative w-20 h-20 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "conic-gradient(from 0deg, #0071e3, #af52de, #ff375f, #0071e3)", padding: "3px" }}
                >
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-950" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(0,113,227,0.3) 0%, transparent 70%)", filter: "blur(20px)" }}
                />
                {/* ★ FIXED: Logo instead of Sparkles */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Logo className="w-7 h-7" />
                </div>
              </div>

              <div>
                <h2 className="hero-heading text-3xl text-slate-900 dark:text-white mb-2 tracking-tight">
                  {mode === "document" ? "Analyzing your document" : mode === "text" ? "Processing your content" : "Creating your deck"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                  {mode === "document" && file ? `Parsing ${file.name} · ` : ""}
                  Please don&apos;t close this tab · Usually 15–30 seconds
                </p>
              </div>

              {/* Stage Progress — ★ FIXED: Bullets always visible with proper styles */}
              <div className="space-y-2.5 text-left">
                {stages.map((stage, idx) => {
                  const isDone = currentStage > idx;
                  const isActive = currentStage === idx;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0.25, x: -5 }}
                      animate={{ opacity: isDone || isActive ? 1 : 0.3, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <motion.div
                        animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "11px",
                          fontWeight: 700,
                          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                          transition: "all 0.3s ease",
                          ...(isDone
                            ? {
                                background: "linear-gradient(135deg, #10b981, #059669)",
                                color: "#ffffff",
                                boxShadow: "0 4px 12px -2px rgba(16, 185, 129, 0.4)",
                              }
                            : isActive
                              ? {
                                  background: "linear-gradient(135deg, #0071e3, #00B4D8)",
                                  color: "#ffffff",
                                  boxShadow: "0 4px 14px -2px rgba(0, 113, 227, 0.5)",
                                }
                              : {
                                  background: "rgba(0,0,0,0.04)",
                                  color: "#94a3b8",
                                  boxShadow: "none",
                                }),
                        }}
                        className="dark:bg-slate-800"
                      >
                        {isDone ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </motion.div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: isActive ? 600 : isDone ? 500 : 400,
                          color: isActive
                            ? "var(--foreground, #0f172a)"
                            : isDone
                              ? "#10b981"
                              : "#94a3b8",
                          transition: "color 0.3s ease",
                        }}
                        className={isActive ? "text-slate-900 dark:text-white font-semibold" : isDone ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}
                      >
                        {stage}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <QuotaExceededModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        currentPlan={userProfile?.plan || "free"}
        used={userProfile?.ppt_count_month || 0}
      />
    </div>
  );
}