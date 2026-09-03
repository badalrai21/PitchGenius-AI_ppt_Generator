"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, Users, Eye, Play, Pause, Copy, Check,
  Radio, LogOut, Mic, MicOff
} from "lucide-react";
import { SlideRenderer } from "@/components/editor/slides/SlideRenderer";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { usePresentationStore } from "@/stores/usePresentationStore";

interface PresenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: any[];
  theme: any;
  initialSlideIndex?: number;
}

interface AudienceMember {
  id: string;
  viewer_name: string;
  viewer_avatar_color: string;
  joined_at: string;
  is_online: boolean;
}

function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function PresenterModal({ isOpen, onClose, slides, theme, initialSlideIndex = 0 }: PresenterModalProps) {
  const { id: presentationId, title: presentationTitle } = usePresentationStore();

  const [currentSlide, setCurrentSlide] = useState(initialSlideIndex);
  const [sessionCode, setSessionCode] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [audience, setAudience] = useState<AudienceMember[]>([]);
  const [showAudiencePanel, setShowAudiencePanel] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [presenterName, setPresenterName] = useState<string>("");
  const [micEnabled, setMicEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [slideStartTime, setSlideStartTime] = useState<number>(Date.now());
  const [totalDuration, setTotalDuration] = useState<number>(0);

  // ★ Dynamic configuration states
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([{ urls: "stun:stun.l.google.com:19302" }]);
  const [appBaseUrl, setAppBaseUrl] = useState<string>("");

  // Responsive slide sizing with ResizeObserver
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [slideSize, setSlideSize] = useState({ width: 0, height: 0 });

  const supabase = createClient();
  const channelRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // ★ DYNAMIC SETTINGS FROM DB
  useEffect(() => {
    if (!isOpen) return;

    async function loadDynamicPresenterConfig() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["app_url", "webrtc_ice_servers"]);

        if (settings && settings.length > 0) {
          settings.forEach((s) => {
            if (s.key === "app_url" && s.value) {
              setAppBaseUrl(s.value);
            }
            if (s.key === "webrtc_ice_servers" && s.value) {
              try {
                const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
                if (Array.isArray(parsed)) setIceServers(parsed);
              } catch (e) {
                console.warn("Could not parse webrtc_ice_servers:", e);
              }
            }
          });
        }
      } catch (err) {
        console.warn("Failed to load presenter config from settings:", err);
      }
    }

    loadDynamicPresenterConfig();
  }, [isOpen, supabase]);

  // ResizeObserver: recalculate slide size on window resize
  useEffect(() => {
    if (!isOpen) return;

    const calculateSize = () => {
      const container = slideContainerRef.current?.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const availableWidth = containerRect.width - 32;
      const availableHeight = containerRect.height - 32;

      const aspectRatio = 16 / 9;
      let width = availableWidth;
      let height = width / aspectRatio;

      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }

      setSlideSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    calculateSize();

    const container = slideContainerRef.current?.parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver(calculateSize);
    resizeObserver.observe(container);
    window.addEventListener("resize", calculateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateSize);
    };
  }, [isOpen, showAudiencePanel]);

  // Create session
  useEffect(() => {
    if (!isOpen || sessionId) return;

    (async () => {
      const code = generateSessionCode();
      const { data: { user } } = await supabase.auth.getUser();

      let name = "Presenter";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        name = profile?.full_name ||
               user.user_metadata?.full_name ||
               user.user_metadata?.name ||
               user.email?.split("@")[0] ||
               "Presenter";
      }
      setPresenterName(name);

      try {
        const { data, error } = await supabase
          .from("presenter_sessions")
          .insert({
            session_code: code,
            host_user_id: user?.id || null,
            presentation_id: presentationId || null,
            current_slide: initialSlideIndex,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        setSessionId(data.id);
        setSessionCode(code);
        setSlideStartTime(Date.now());
        toast.success(`Live session started · Code: ${code}`, { duration: 3000 });
      } catch (err: any) {
        console.error("Failed to create session:", err);
        toast.error("Could not start live session");
      }
    })();
  }, [isOpen, sessionId, presentationId, initialSlideIndex, supabase]);

  useEffect(() => {
    if (!sessionId || isPaused) return;
    const interval = setInterval(() => setTotalDuration(Date.now() - slideStartTime), 1000);
    return () => clearInterval(interval);
  }, [sessionId, slideStartTime, isPaused]);

  useEffect(() => setSlideStartTime(Date.now()), [currentSlide]);

  // Subscribe to audience + WebRTC signals
  useEffect(() => {
    if (!sessionId) return;

    const fetchAudience = async () => {
      const { data } = await supabase
        .from("audience_members")
        .select("*")
        .eq("session_id", sessionId)
        .eq("is_online", true)
        .order("joined_at", { ascending: true });
      if (data) setAudience(data as AudienceMember[]);
    };
    fetchAudience();

    const channel = supabase
      .channel(`presenter_${sessionId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "audience_members", filter: `session_id=eq.${sessionId}` },
        async (payload) => {
          const newMember = payload.new as AudienceMember;
          setAudience((prev) => [...prev, newMember]);
          toast.info(`${newMember.viewer_name} joined`, { duration: 2000 });

          if (micEnabled && micStreamRef.current) {
            await createPeerConnectionForViewer(newMember.id);
          }
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "audience_members", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as AudienceMember;
          setAudience((prev) => {
            if (!updated.is_online) {
              const pc = peerConnectionsRef.current.get(updated.id);
              if (pc) {
                pc.close();
                peerConnectionsRef.current.delete(updated.id);
              }
              return prev.filter((m) => m.id !== updated.id);
            }
            return prev.map((m) => (m.id === updated.id ? updated : m));
          });
        }
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "webrtc_signals", filter: `session_id=eq.${sessionId}` },
        async (payload) => {
          const signal = payload.new as any;
          if (signal.to_id !== "host") return;

          const pc = peerConnectionsRef.current.get(signal.from_id);
          if (!pc) return;

          try {
            if (signal.signal_type === "answer") {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            } else if (signal.signal_type === "ice") {
              await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
            }
          } catch (err) {
            console.error("Signal handling error:", err);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, supabase, micEnabled]);

  // Sync slide + pause state
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      await supabase
        .from("presenter_sessions")
        .update({
          current_slide: currentSlide,
          is_paused: isPaused,
        })
        .eq("id", sessionId);
    })();
  }, [currentSlide, isPaused, sessionId, supabase]);

  // WebRTC helpers
  const createPeerConnectionForViewer = async (viewerId: string) => {
    if (!micStreamRef.current || !sessionId) return;

    try {
      const pc = new RTCPeerConnection({
        iceServers: iceServers,
      });

      micStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, micStreamRef.current!);
      });

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await supabase.from("webrtc_signals").insert({
            session_id: sessionId,
            from_id: "host",
            to_id: viewerId,
            signal_type: "ice",
            payload: event.candidate.toJSON(),
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await supabase.from("webrtc_signals").insert({
        session_id: sessionId,
        from_id: "host",
        to_id: viewerId,
        signal_type: "offer",
        payload: offer,
      });

      peerConnectionsRef.current.set(viewerId, pc);
    } catch (err) {
      console.error("Peer connection error:", err);
    }
  };

  const toggleMic = async () => {
    if (micEnabled) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      micStreamRef.current = null;
      setMicEnabled(false);
      toast.success("Microphone off", { duration: 1500 });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setMicEnabled(true);
        toast.success("Microphone active — audience can hear you", { duration: 2500 });

        for (const member of audience) {
          await createPeerConnectionForViewer(member.id);
        }
      } catch (err) {
        toast.error("Microphone access denied", { duration: 3000 });
      }
    }
  };

  // Pause/Resume toggle
  const togglePause = () => {
    const newState = !isPaused;
    setIsPaused(newState);
    toast.success(newState ? "Presentation paused" : "Presentation resumed", { duration: 1500 });
  };

  const handleEndSession = useCallback(async () => {
    if (sessionId) {
      await supabase
        .from("presenter_sessions")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", sessionId);
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    setSessionCode("");
    setSessionId("");
    setAudience([]);
    setMicEnabled(false);
    setIsPaused(false);
    onClose();
  }, [sessionId, supabase, onClose]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPaused) {
      toast.info("Presentation is paused — resume to navigate", { duration: 1500 });
      return;
    }
    setCurrentSlide((i) => Math.max(0, i - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPaused) {
      toast.info("Presentation is paused — resume to navigate", { duration: 1500 });
      return;
    }
    setCurrentSlide((i) => Math.min(slides.length - 1, i + 1));
  };

  const originUrl = appBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const joinUrl = sessionCode ? `${originUrl}/join/${sessionCode}` : "";

  const copyCode = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success("Join link copied!", { duration: 1500 });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((i) => Math.min(slides.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide((i) => Math.max(0, i - 1));
      } else if (e.key === "Escape") {
        handleEndSession();
      } else if (e.key === "p" || e.key === "P") {
        togglePause();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, slides.length, handleEndSession, isPaused]);

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];
  const slidesRemaining = slides.length - currentSlide - 1;
  const progressPercent = ((currentSlide + 1) / slides.length) * 100;
  const displayInitial = presenterName?.charAt(0)?.toUpperCase() || "P";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-100 dark:bg-slate-900 flex flex-col overflow-hidden"
      >
        {/* TOP BAR */}
        <div className="h-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30">
              <div className={`w-2 h-2 rounded-full bg-red-500 ${isPaused ? '' : 'animate-pulse'}`} />
              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                {isPaused ? "PAUSED" : "LIVE"}
              </span>
            </div>

            {sessionCode && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Radio className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Code:</span>
                <span className="text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400 tracking-widest">{sessionCode}</span>
                <button onClick={copyCode} className="ml-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}

            <button
              onClick={() => setShowAudiencePanel(!showAudiencePanel)}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{audience.length}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">watching</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause/Resume button */}
            <button
              onClick={togglePause}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                isPaused
                  ? "bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title="Toggle pause (P)"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </button>

            <button
              onClick={toggleMic}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                micEnabled
                  ? "bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {micEnabled ? (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Mic On</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Mic Off</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono px-3">
              {currentSlide + 1} / {slides.length}
            </span>

            <button
              onClick={handleEndSession}
              className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 transition-colors border border-red-200 dark:border-red-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>End Session</span>
            </button>
          </div>
        </div>

        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 shrink-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* SLIDE VIEWPORT — Responsive */}
          <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden min-w-0">
            <div
              ref={slideContainerRef}
              className="relative"
              style={{
                width: slideSize.width > 0 ? `${slideSize.width}px` : "auto",
                height: slideSize.height > 0 ? `${slideSize.height}px` : "auto",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  {currentSlideData && (
                    <SlideRenderer slide={currentSlideData} theme={theme} isEditable={false} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Pause overlay */}
              {isPaused && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl z-30"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4">
                      <Pause className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">Paused</p>
                    <p className="text-sm text-white/70">Press P or click Resume to continue</p>
                  </div>
                </motion.div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePrev}
              disabled={currentSlide === 0 || isPaused}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg border border-slate-200 dark:border-slate-700 z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentSlide === slides.length - 1 || isPaused}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg border border-slate-200 dark:border-slate-700 z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="w-7 h-7" strokeWidth={2.5} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg z-20">
              {slides.slice(0, Math.min(slides.length, 10)).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => !isPaused && setCurrentSlide(idx)}
                  disabled={isPaused}
                  className={`transition-all duration-300 rounded-full disabled:opacity-40 ${
                    idx === currentSlide
                      ? "w-6 h-2 bg-gradient-to-r from-cyan-500 to-blue-600"
                      : "w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                  }`}
                />
              ))}
              {slides.length > 10 && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2 font-mono">+{slides.length - 10}</span>
              )}
            </div>
          </div>

          {/* AUDIENCE SIDEBAR */}
          {showAudiencePanel && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="w-80 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-xl"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0" style={{ background: "linear-gradient(135deg, #06b6d4, #2563eb)" }}>
                    {displayInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{presenterName || "Loading..."}</p>
                    <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                      {isPaused ? "Presentation Paused" : "Presenting Live"}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">{presentationTitle || "Untitled Presentation"}</p>
              </div>

              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Live Audience
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    {audience.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Real-time viewers</p>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {audience.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">No viewers yet</p>
                    <p className="text-[10px] text-slate-500 mb-3">Share code <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{sessionCode}</span></p>
                    <button onClick={() => setShowQR(true)} className="text-[10px] px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-bold hover:bg-cyan-200 dark:hover:bg-cyan-500/30 transition-colors">
                      Show QR code
                    </button>
                  </div>
                ) : (
                  audience.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm" style={{ backgroundColor: member.viewer_avatar_color || "#0077B6" }}>
                        {member.viewer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{member.viewer_name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[9px] text-slate-500 dark:text-slate-400">Watching · {new Date(member.joined_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-center border border-slate-100 dark:border-slate-800">
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{audience.length}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Live Viewers</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-center border border-slate-100 dark:border-slate-800">
                    <div className="text-base font-bold text-cyan-600 dark:text-cyan-400">{currentSlide + 1}/{slides.length}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Current Slide</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-center border border-slate-100 dark:border-slate-800">
                    <div className="text-base font-bold text-purple-600 dark:text-purple-400">{slidesRemaining}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Remaining</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-center border border-slate-100 dark:border-slate-800">
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">{formatDuration(totalDuration)}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Slide Time</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Progress</span>
                    <span className="text-[9px] text-slate-600 dark:text-slate-300 font-mono font-bold">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #06b6d4, #2563eb)" }} />
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </div>

        {/* QR MODAL */}
        {showQR && sessionCode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md text-center shadow-2xl border border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">LIVE SESSION</span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display">Join the Presentation</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Scan QR code or enter session code below</p>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-4 inline-block border border-slate-200 dark:border-slate-700">
                <QRCodeSVG value={joinUrl} size={200} />
              </div>

              <div className="mb-6">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2">Session Code</p>
                <div className="text-4xl font-black font-mono tracking-widest text-slate-900 dark:text-white">{sessionCode}</div>
              </div>

              {/* Copy button with strong dark background */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1 text-left font-mono">{joinUrl}</span>
                <button
                  onClick={copyCode}
                  style={{
                    backgroundColor: copied ? "#10b981" : "#0f172a",
                    color: "#ffffff",
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md hover:opacity-90 transition-opacity border border-slate-900"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>

              <button onClick={() => setShowQR(false)} className="mt-4 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}