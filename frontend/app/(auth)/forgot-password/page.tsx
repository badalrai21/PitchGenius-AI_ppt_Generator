"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Mail, ArrowRight, ArrowLeft, Sun, Moon, CheckCircle2, Shield, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";

const BgEnvironment = ({ mouseX, mouseY }: { mouseX: number; mouseY: number }) => (
  <>
    <div className="ap-parallax-orb" style={{ left: mouseX, top: mouseY }} />
    <div className="ap-grain" />
    <div className="ap-env">
      <div className="ap-aurora">
        <div className="ap-ab" /><div className="ap-ab" /><div className="ap-ab" /><div className="ap-ab" />
      </div>
      <div className="ap-beams">
        <div className="ap-beam" /><div className="ap-beam" /><div className="ap-beam" />
      </div>
      <div className="ap-mesh">
        <div className="ap-mesh-grid" />
        <div className="ap-mesh-dots" />
      </div>
      <div className="ap-orbits">
        <div className="ap-orbit"><div className="ap-orbit-dot" /></div>
        <div className="ap-orbit"><div className="ap-orbit-dot" /></div>
        <div className="ap-orbit"><div className="ap-orbit-dot" /></div>
      </div>
      <div className="ap-shapes">
        <div className="ap-shape"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="none" stroke="rgba(0,113,227,0.3)" strokeWidth="1" /></svg></div>
        <div className="ap-shape"><svg viewBox="0 0 40 40"><polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="rgba(175,82,222,0.3)" strokeWidth="1" /></svg></div>
        <div className="ap-shape"><svg viewBox="0 0 80 80"><polygon points="40,4 74,22 74,58 40,76 6,58 6,22" fill="none" stroke="rgba(255,55,95,0.25)" strokeWidth="1" /></svg></div>
      </div>
      <div className="ap-particles">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="ap-p" style={{
            left: `${(i * 13 + 7) % 100}%`,
            animationDuration: `${8 + (i % 10)}s`,
            animationDelay: `${(i * 1.1) % 12}s`,
            width: `${2 + (i % 4)}px`,
            height: `${2 + (i % 4)}px`,
          }} />
        ))}
      </div>
      <div className="ap-sparkles">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="ap-sparkle" style={{
            left: `${(i * 17 + 11) % 100}%`,
            top: `${(i * 23 + 9) % 100}%`,
            animationDelay: `${(i * 0.4) % 3}s`,
          }} />
        ))}
      </div>
    </div>
  </>
);

type View = "form" | "sent";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("form");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const [appName, setAppName] = useState("PitchGenius");
  const [narrativeHeading, setNarrativeHeading] = useState("Forgot your\npassword?");
  const [narrativeText, setNarrativeText] = useState("No worries. Enter your email and we'll send you a secure link to reset your password instantly.");

  useEffect(() => {
    setMounted(true);
    const fn = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", fn);

    async function loadSettings() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["app_name", "forgot_narrative_heading", "forgot_narrative_text"]);
        if (settings) {
          settings.forEach((s) => {
            if (s.key === "app_name" && s.value) setAppName(s.value);
            if (s.key === "forgot_narrative_heading" && s.value) setNarrativeHeading(s.value);
            if (s.key === "forgot_narrative_text" && s.value) setNarrativeText(s.value);
          });
        }
      } catch (err) {
        console.warn("Load settings failed:", err);
      }
    }
    loadSettings();

    return () => window.removeEventListener("mousemove", fn);
  }, [supabase]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email."); return; }

    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        }
      );
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }
      setView("sent");
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset link.");
      setLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-white dark:bg-slate-950" />;

  return (
    <div className="ap">
      <BgEnvironment mouseX={mouseX} mouseY={mouseY} />

      <nav className="ap-nav">
        <Link href="/" className="ap-logo">
          <Logo className="h-7 w-7" />
          {appName}
        </Link>
        <div className="ap-nav-r">
          <Link href="/login" className="ap-nav-a ap-nav-cta">Sign In</Link>
          <div className="ap-nav-divider" />
          <button type="button" className="ap-theme-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </nav>

      <div className="ap-auth-split-wrapper">
        <div className="ap-auth-inner-split">
          {/* Narrative Side */}
          <motion.div
            className="ap-auth-side-narrative"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="ap-narrative-eyebrow"
              style={{
                color: "var(--pink)",
                background: "var(--pink-g)",
                borderColor: "rgba(255,55,95,0.15)",
              }}
            >
              Account Recovery
            </span>
            <h1 className="ap-narrative-h1">
              {narrativeHeading.split("\n")[0]}
              <br />
              <span className="italic-gradient">
                {narrativeHeading.split("\n")[1] || "password?"}
              </span>
            </h1>
            <p className="ap-narrative-p">{narrativeText}</p>
            <div className="ap-narrative-features">
              <div className="ap-narrative-feat">
                <div
                  className="ap-narrative-feat-circle"
                  style={{
                    background: "rgba(255,55,95,0.08)",
                    color: "var(--pink)",
                  }}
                >
                  <Shield size={12} />
                </div>
                <span>Secure password recovery</span>
              </div>
              <div className="ap-narrative-feat">
                <div
                  className="ap-narrative-feat-circle"
                  style={{
                    background: "rgba(255,55,95,0.08)",
                    color: "var(--pink)",
                  }}
                >
                  <Key size={12} />
                </div>
                <span>Instant email delivery</span>
              </div>
            </div>
          </motion.div>

          {/* Card Side */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <motion.div
              className="ap-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <AnimatePresence mode="wait">
                {view === "sent" ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="ap-card-head">
                      <div
                        className="ap-card-ic"
                        style={{
                          background: "linear-gradient(135deg, #34c759, #30d158)",
                        }}
                      >
                        <CheckCircle2 size={24} />
                      </div>
                      <h2 className="ap-card-t">Check your inbox</h2>
                      <p className="ap-card-s">
                        We&apos;ve sent a password reset link to
                      </p>
                    </div>

                    <div
                      style={{
                        textAlign: "center",
                        padding: "16px 20px",
                        background: "var(--input)",
                        borderRadius: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--t1)",
                          wordBreak: "break-all",
                        }}
                      >
                        {email}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        background: "var(--input)",
                        borderRadius: "12px",
                        marginBottom: "24px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--blue)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Mail size={12} />
                        Next steps
                      </p>
                      <ol
                        style={{
                          fontSize: "13px",
                          color: "var(--t2)",
                          paddingLeft: "18px",
                          margin: 0,
                          lineHeight: 1.8,
                        }}
                      >
                        <li>Open the recovery email</li>
                        <li>Click the secure reset link</li>
                        <li>Create your new password</li>
                      </ol>
                    </div>

                    <button
                      className="ap-btn"
                      type="button"
                      onClick={() => {
                        setView("form");
                        setEmail("");
                        setError("");
                      }}
                      style={{
                        background: "var(--input)",
                        color: "var(--t1)",
                        boxShadow: "none",
                      }}
                    >
                      <ArrowLeft size={14} /> Send another link
                    </button>

                    <div className="ap-foot">
                      <Link href="/login" className="ap-a">
                        Back to Sign In
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="ap-card-head">
                      <div className="ap-card-ic">
                        <Mail size={24} />
                      </div>
                      <h2 className="ap-card-t">Reset password</h2>
                      <p className="ap-card-s">
                        Enter your email to receive a reset link
                      </p>
                    </div>

                    {error && <div className="ap-berr">{error}</div>}

                    <form onSubmit={handleSendLink}>
                      <div className="ap-f">
                        <div className="ap-fi">
                          <span className="ap-ic">
                            <Mail size={16} />
                          </span>
                          <input
                            className="ap-in"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setError("");
                            }}
                            autoFocus
                            required
                          />
                        </div>
                      </div>

                      <button
                        className="ap-btn"
                        type="submit"
                        disabled={loading}
                        style={{ marginTop: 8 }}
                      >
                        {loading ? (
                          <>
                            <span className="ap-spin" /> Sending…
                          </>
                        ) : (
                          <>
                            Send Reset Link <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="ap-foot">
                      Remember your password?{" "}
                      <Link href="/login" className="ap-a">
                        Sign in
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}