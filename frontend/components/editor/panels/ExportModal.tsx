"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2, CheckCircle2 } from "lucide-react";
import { usePresentationStore } from "@/stores/usePresentationStore";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom PPT Icon (crisp, professional)
function PptIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor" opacity="0.15" />
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="12" y="17" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="900" fontFamily="Arial, sans-serif">PPT</text>
    </svg>
  );
}

// Custom PDF Icon (crisp, professional)
function PdfIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor" opacity="0.15" />
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="12" y="17" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="900" fontFamily="Arial, sans-serif">PDF</text>
    </svg>
  );
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { title, slides, theme, id } = usePresentationStore();
  const [exporting, setExporting] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const supabase = createClient();

  const handleExport = async (format: "pptx" | "pdf") => {
    setExporting(format);
    setDone(null);
    const toastId = toast.loading(`Preparing your ${format.toUpperCase()} file...`);

    try {
      // ★ DYNAMIC BACKEND URL LOOKUP: Pull config from Supabase settings
      const { data: settingData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "backend_url")
        .maybeSingle();

      const backendUrl =
        settingData?.value ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:8000";

      const res = await fetch(`${backendUrl}/api/v1/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentation_id: id,
          title,
          slides,
          theme,
          include_images: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Export error response:", errText.substring(0, 300));
        throw new Error(`Export failed: HTTP ${res.status}. Ensure backend export endpoint exists.`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const errData = await res.json();
        throw new Error(errData.detail || "Export server returned error");
      }

      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Received empty file from server");

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "presentation").replace(/[^a-zA-Z0-9 ]/g, "").trim() || "presentation"}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setExporting(null);
      setDone(format);
      toast.success(`${format.toUpperCase()} downloaded!`, { id: toastId, duration: 2000 });
      setTimeout(() => setDone(null), 2000);
    } catch (err: any) {
      console.error("Export error:", err);
      setExporting(null);
      toast.error(err.message || "Export failed. Is the backend running?", { id: toastId, duration: 3000 });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                  <Download className="w-4 h-4" />
                </div>
                <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-white">Export Presentation</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-light">
              Choose your export format. Files are generated with real images and full formatting.
            </p>

            <div className="space-y-3">
              {/* PowerPoint Option */}
              <button
                onClick={() => handleExport("pptx")}
                disabled={!!exporting}
                className="w-full p-5 text-left rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-orange-500/40 hover:bg-orange-500/[0.02] flex items-center justify-between group transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
                    {exporting === "pptx" ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : done === "pptx" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <PptIcon className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">PowerPoint</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Editable .pptx with images & animations</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" />
              </button>

              {/* PDF Option */}
              <button
                onClick={() => handleExport("pdf")}
                disabled={!!exporting}
                className="w-full p-5 text-left rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-red-500/40 hover:bg-red-500/[0.02] flex items-center justify-between group transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20 shrink-0">
                    {exporting === "pdf" ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : done === "pdf" ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <PdfIcon className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">PDF Document</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Print-ready with high-fidelity vectors</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors" />
              </button>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-6 text-center font-bold uppercase tracking-wider">
              {slides.length} slides · {title || "Untitled"}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}