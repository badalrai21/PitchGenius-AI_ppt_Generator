"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Users, AlertCircle, LogIn, User, ArrowRight, 
  Volume2, VolumeX, Pause, ShieldCheck, Mail, Sparkles, HelpCircle 
} from "lucide-react";
import { SlideRenderer } from "@/components/editor/slides/SlideRenderer";
import { BrandLoader } from "@/components/ui/BrandLoader";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { toast } from "sonner";

const AVATAR_COLORS = [
  "#0071e3", "#af52de", "#ff375f", "#ff9500", "#30d158", "#00c766"
];

export default function JoinSessionPage() {
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();
  const router = useRouter();
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"name" | "joining" | "viewing" | "error">("name");
  const [viewerName, setViewerName] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);
  const [presentation, setPresentation] = useState<any>(null);
  const [presenterName, setPresenterName] = useState<string>("Presenter");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audienceCount, setAudienceCount] = useState(0);
  const [myMemberId, setMyMemberId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");
  const [audioMuted, setAudioMuted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [appName, setAppName] = useState("PitchGenius");

  // Responsive slide sizing container ref
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [slideSize, setSlideSize] = useState({ width: 0, height: 0 });

  const heartbeatRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    setMounted(true);
    
    async function loadAppName() {
      try {
        const { data: settingData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "app_name")
          .maybeSingle();
        if (settingData?.value) setAppName(settingData.value);
      } catch {}
    }
    loadAppName();
  }, [supabase]);

  // Responsive fit-to-screen computation with ResizeObserver
  useEffect(() => {
    if (step !== "viewing") return;

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
  }, [step]);

  // Handle joining flow and fetching presentation data
  const handleJoin = async () => {
    if (!viewerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setStep("joining");

    try {
      // 1. Locate live active session
      const { data: session, error: sessionError } = await supabase
        .from("presenter_sessions")
        .select("*")
        .eq("session_code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (sessionError || !session) {
        setErrorMsg("This live session has ended or the code is invalid.");
        setStep("error");
        return;
      }

      setSessionData(session);
      setCurrentSlide(session.current_slide || 0);
      setIsPaused(session.is_paused || false);

      // 2. Fetch presentation record from DB
      if (session.presentation_id) {
        const { data: pres, error: presError } = await supabase
          .from("presentations")
          .select("*")
          .eq("id", session.presentation_id)
          .maybeSingle();
          
        if (presError) {
          console.warn("[Join] RLS restriction or fetch error:", presError.message);
        }
        if (pres) {
          setPresentation(pres);
        }
      }

      // 3. Resolve host user profile name
      if (session.host_user_id) {
        const { data: hostProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.host_user_id)
          .maybeSingle();
        if (hostProfile?.full_name) {
          setPresenterName(hostProfile.full_name);
        }
      }

      // 4. Register viewer in audience_members
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const { data: member, error: joinError } = await supabase
        .from("audience_members")
        .insert({
          session_id: session.id,
          viewer_name: viewerName.trim(),
          viewer_avatar_color: avatarColor,
          is_online: true,
        })
        .select()
        .single();

      if (joinError) throw joinError;

      setMyMemberId(member.id);
      setStep("viewing");
      toast.success("Joined the session!");

      // 5. Send periodic presence heartbeat
      heartbeatRef.current = setInterval(async () => {
        await supabase
          .from("audience_members")
          .update({ last_ping: new Date().toISOString(), is_online: true })
          .eq("id", member.id);
      }, 20000);
    } catch (err: any) {
      console.error("[Join] Error:", err);
      setErrorMsg(err.message || "Could not join session.");
      setStep("error");
    }
  };

  // Real-time synchronization
  useEffect(() => {
    if (!sessionData?.id || !myMemberId) return;

    // Use a clean, randomized channel name to prevent overlapping subscription callbacks
    const channelName = `viewer_sync_${sessionData.id}_${myMemberId}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "presenter_sessions", filter: `id=eq.${sessionData.id}` },
        async (payload) => {
          const newSession = payload.new as any;
          setCurrentSlide(newSession.current_slide || 0);
          setIsPaused(newSession.is_paused || false);

          // If slides were not loaded previously, fetch again now that session has updated
          if (!presentation && newSession.presentation_id) {
            const { data: pres } = await supabase
              .from("presentations")
              .select("*")
              .eq("id", newSession.presentation_id)
              .maybeSingle();
            if (pres) setPresentation(pres);
          }

          if (!newSession.is_active) {
            toast.info("Presenter has ended the session");
            setStep("error");
            setErrorMsg("Session ended by host. Thanks for watching!");
          }
        }
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "audience_members", filter: `session_id=eq.${sessionData.id}` },
        async () => {
          const { count } = await supabase
            .from("audience_members")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionData.id)
            .eq("is_online", true);
          setAudienceCount(count || 0);
        }
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "webrtc_signals", filter: `session_id=eq.${sessionData.id}` },
        async (payload) => {
          const signal = payload.new as any;
          if (signal.to_id !== myMemberId) return;

          try {
            if (signal.signal_type === "offer") {
              const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

              pc.ontrack = (event) => {
                if (audioRef.current) {
                  audioRef.current.srcObject = event.streams[0];
                  audioRef.current.play().catch(() => {
                    toast.info("Tap anywhere to enable presenter audio");
                  });
                  setMicActive(true);
                  toast.success("🎤 Presenter microphone connected");
                }
              };

              pc.onicecandidate = async (event) => {
                if (event.candidate) {
                  await supabase.from("webrtc_signals").insert({
                    session_id: sessionData.id,
                    from_id: myMemberId,
                    to_id: "host",
                    signal_type: "ice",
                    payload: event.candidate.toJSON(),
                  });
                }
              };

              await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await supabase.from("webrtc_signals").insert({
                session_id: sessionData.id,
                from_id: myMemberId,
                to_id: "host",
                signal_type: "answer",
                payload: answer,
              });

              peerConnectionRef.current = pc;
            } else if (signal.signal_type === "ice" && peerConnectionRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.payload));
            }
          } catch (err) {
            console.error("WebRTC handling error:", err);
          }
        }
      )
      .subscribe();

    // Fetch initial audience count
    (async () => {
      const { count } = await supabase
        .from("audience_members")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionData.id)
        .eq("is_online", true);
      setAudienceCount(count || 0);
    })();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionData?.id, myMemberId, supabase, presentation]);

  // Clean up references and set offline status on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (myMemberId) {
        supabase.from("audience_members").update({ is_online: false }).eq("id", myMemberId).then();
      }
    };
  }, [myMemberId, supabase]);

  const toggleAudio = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioMuted;
      setAudioMuted(!audioMuted);
    }
  };

  if (!mounted) return null;

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: ENTER NAME
  // ═══════════════════════════════════════════════════════════════
  if (step === "name") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">LIVE SESSION</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-2">Join Presentation</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
              Code: <span className="font-bold text-cyan-600 dark:text-cyan-400">{code}</span>
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={viewerName}
                onChange={(e) => setViewerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter your name"
                autoFocus
                maxLength={30}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!viewerName.trim()}
              style={{
                backgroundColor: !viewerName.trim() ? "#94a3b8" : "#0071e3",
                color: "#ffffff",
              }}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-lg border-none"
            >
              <LogIn className="w-4 h-4" />
              <span>Join Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-4">
            You&apos;ll follow the presenter&apos;s slides live in real-time.
          </p>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: JOINING LOADER
  // ═══════════════════════════════════════════════════════════════
  if (step === "joining") {
    return <BrandLoader fullscreen size="lg" label="Connecting to presenter stream..." />;
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: ERROR STATE
  // ═══════════════════════════════════════════════════════════════
  if (step === "error") {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 p-8 text-center shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-display">Cannot Join Session</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{errorMsg}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: ACTIVE VIEWING CANVAS
  // ═══════════════════════════════════════════════════════════════
  const slides = presentation?.slides_data || [];
  const slide = slides[currentSlide];
  const theme = presentation?.custom_theme || {};

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-900 flex flex-col overflow-hidden font-sans">
      <audio ref={audioRef} autoPlay playsInline />

      {/* Top Session Header Bar */}
      <div className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30">
            <div className={`w-2 h-2 rounded-full bg-red-500 ${isPaused ? '' : 'animate-pulse'}`} />
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
              {isPaused ? "PAUSED" : "LIVE"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {presenterName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{presenterName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Presenting to you</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {micActive && (
            <button
              onClick={toggleAudio}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
                audioMuted
                  ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                  : "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{audioMuted ? "Muted" : "Audio On"}</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{audienceCount}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">watching</span>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
            Slide {currentSlide + 1} of {slides.length || "?"}
          </span>
        </div>
      </div>

      {/* Main Slide Viewport */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden min-h-0">
        {slides.length === 0 ? (
          <div className="text-center max-w-md">
            <BrandLoader size="md" variant="inline" label="Loading presentation..." />
            <p className="text-xs text-slate-500 mt-2">{presenterName} will start soon</p>
          </div>
        ) : (
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
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                {slide ? (
                  <SlideRenderer slide={slide} theme={theme} isEditable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-2xl">
                    <p className="text-slate-500">Waiting for next slide...</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Host pause overlay */}
            {isPaused && (
              <motion.div
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl z-30"
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4">
                    <Pause className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1 font-display">Presenter is Paused</p>
                  <p className="text-sm text-white/70 font-light">The presentation will resume shortly</p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="h-10 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-center shrink-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
          🔴 Watching live · Synchronized with host
        </p>
      </div>
    </div>
  );
}