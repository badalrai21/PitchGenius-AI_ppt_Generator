"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Copy, Check, Globe, Lock, QrCode, Download, ExternalLink, ToggleRight, ToggleLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentationId: string | null;
  initialIsPublic?: boolean;
}

export function ShareModal({
  isOpen,
  onClose,
  presentationId,
  initialIsPublic = false,
}: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareToken, setShareToken] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [appBaseUrl, setAppBaseUrl] = useState<string>("");

  const supabase = createClient();

  useEffect(() => {
    async function loadShareDetails() {
      if (!presentationId) return;

      try {
        // 1. Fetch live share status from presentations table
        const { data } = await supabase
          .from("presentations")
          .select("is_public, share_token")
          .eq("id", presentationId)
          .single();

        if (data) {
          setIsPublic(data.is_public);
          setShareToken(data.share_token || presentationId);
        } else {
          setShareToken(presentationId);
        }

        // 2. ★ DYNAMIC APP URL LOOKUP: Pull app URL from database settings
        const { data: settingData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "app_url")
          .maybeSingle();

        if (settingData && settingData.value) {
          setAppBaseUrl(settingData.value);
        }
      } catch (err) {
        console.warn("Failed to load presentation share settings:", err);
      }
    }

    if (isOpen) {
      loadShareDetails();
    }
  }, [isOpen, presentationId, supabase]);

  const originUrl = appBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const publicUrl = `${originUrl}/p/${shareToken || presentationId}`;

  const togglePublic = async () => {
    if (!presentationId) return;
    setIsUpdating(true);
    const nextState = !isPublic;
    setIsPublic(nextState);

    const { error } = await supabase
      .from("presentations")
      .update({ is_public: nextState })
      .eq("id", presentationId);

    setIsUpdating(false);
    if (!error) {
      toast.success(nextState ? "Presentation is now public!" : "Presentation is now private.");
    } else {
      setIsPublic(!nextState);
      toast.error("Failed to update share permissions.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Presentation URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const svg = document.getElementById("presentation-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `presentation-qr-${shareToken || presentationId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                  <Share2 className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">Share Presentation</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Public switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 mb-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isPublic ? "bg-teal-500/10 text-teal" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                }`}>
                  {isPublic ? <Globe className="h-5 w-5 text-cyan-600" /> : <Lock className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-display">
                    {isPublic ? "Public Access Enabled" : "Private Session"}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {isPublic ? "Anyone with the link can view" : "Only your profile has viewing access"}
                  </div>
                </div>
              </div>

              <button
                onClick={togglePublic}
                disabled={isUpdating}
                className="text-cyan-600 hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isPublic ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-400" />
                )}
              </button>
            </div>

            {/* Input Segment */}
            {isPublic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 mb-5"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Public Link
                  </label>
                  <div className="flex items-center gap-2 p-1.5 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <input
                      type="text"
                      readOnly
                      value={publicUrl}
                      className="bg-transparent text-xs px-2 flex-1 outline-none text-slate-500 select-all"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shrink-0 flex items-center gap-1.5 shadow"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQR(!showQR)}
                className="py-2.5 px-3 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-slate-900 dark:text-white"
              >
                <QrCode className="h-3.5 w-3.5 text-cyan-600" />
                <span>{showQR ? "Hide QR" : "Show QR"}</span>
              </button>

              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-slate-900 dark:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5 text-cyan-600" />
                <span>Preview Deck</span>
              </a>
            </div>

            {/* QR expansion */}
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 p-4 rounded-2xl bg-slate-50 text-slate-900 flex flex-col items-center justify-center space-y-3 shadow-inner"
              >
                <QRCodeSVG
                  id="presentation-qr-code"
                  value={publicUrl}
                  size={150}
                  level="H"
                  includeMargin={true}
                />
                <button
                  onClick={downloadQR}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download QR Image
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}