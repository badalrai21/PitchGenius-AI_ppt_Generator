"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check, Server, Award, CheckCircle2, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthNavbar } from "@/components/auth/AuthNavbar";
import { toast } from "sonner";

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

type View = "form" | "check_email";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [view, setView] = useState<View>("form");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [fe, setFe] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [resending, setResending] = useState(false);

  const [narrativeHeading, setNarrativeHeading] = useState("Create your\nsecure account.");
  const [narrativeText, setNarrativeText] = useState("Turn your ideas into stunning AI-powered presentations in 30 seconds.");
  const [narrativeFeatures, setNarrativeFeatures] = useState([
    { t: "30-second AI generation", i: "Server" },
    { t: "50,000+ creators trust us", i: "Award" },
  ]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const planParam = params.get("plan");
      if (planParam) setSelectedPlan(planParam.toLowerCase());
    }
    const fn = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", fn);

    async function loadSettings() {
      try {
        const { data: settings } = await supabase.from("settings").select("key, value").in("key", ["signup_narrative_heading", "signup_narrative_text", "signup_narrative_features"]);
        if (settings) {
          settings.forEach((s) => {
            if (s.key === "signup_narrative_heading" && s.value) setNarrativeHeading(s.value);
            if (s.key === "signup_narrative_text" && s.value) setNarrativeText(s.value);
            if (s.key === "signup_narrative_features" && s.value) {
              try {
                const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
                if (Array.isArray(parsed)) setNarrativeFeatures(parsed);
              } catch {}
            }
          });
        }
      } catch (err) { console.warn("Load settings failed:", err); }
    }
    loadSettings();

    return () => window.removeEventListener("mousemove", fn);
  }, [supabase]);

  const str = (() => {
    const p = form.password; let s = 0;
    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const sL = ["", "Weak", "Fair", "Good", "Strong"][str];
  const sC = ["", "#ff3b30", "#ff9500", "#0071e3", "#34c759"][str];

  const next = () => {
    const e: Record<string, string> = {};
    if (step === 1 && !form.name.trim()) e.name = "Required";
    if (step === 2) { if (!form.email) e.email = "Required"; else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid"; }
    if (step === 3) { if (!form.password) e.password = "Required"; else if (form.password.length < 8) e.password = "Min 8 chars"; if (form.confirmPassword !== form.password) e.cp = "No match"; }
    setFe(e); if (Object.keys(e).length) return;
    if (step < 3) setStep(step + 1); else doSubmit();
  };

  const doSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.name.trim(), name: form.name.trim(), plan: selectedPlan },
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });
      if (authError) throw authError;

      // Fire welcome email in background
      try {
        await fetch("/api/auth/welcome", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim(), fullName: form.name.trim() }),
        });
      } catch {}

      // Check if session exists (auto-confirm enabled) OR needs email verification
      if (data?.session) {
        // Email confirmation is OFF — user is logged in immediately
        toast.success("Account created!");
        router.push(selectedPlan !== "free" ? `/dashboard?upgrade=${selectedPlan}` : "/dashboard");
        router.refresh();
      } else {
        // Email confirmation is ON — show check email screen
        setSubmittedEmail(form.email.trim());
        setView("check_email");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resending || !submittedEmail) return;
    setResending(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: submittedEmail,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });
      if (resendError) throw resendError;
      toast.success("Verification email sent again!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend email");
    } finally {
      setResending(false);
    }
  };

  const labels = ["Name", "Email", "Password"];
  const iconMap: Record<string, any> = { Server, Award };

  if (!mounted) return <div className="min-h-screen bg-white dark:bg-slate-950" />;

  return (
    <div className="ap">
      <BgEnvironment mouseX={mouseX} mouseY={mouseY} />

      <AuthNavbar ctaLabel="Sign In" ctaHref="/login" />

      <div className="ap-auth-split-wrapper">
        <div className="ap-auth-inner-split">
          {/* NARRATIVE SIDE */}
          <motion.div className="ap-auth-side-narrative" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <span className="ap-narrative-eyebrow" style={{ color: "var(--purple)", background: "var(--purple-g)", borderColor: "rgba(175,82,222,0.15)" }}>
              {view === "check_email" ? "Almost there" : "Get Started"}
            </span>
            <h1 className="ap-narrative-h1">
              {view === "check_email" ? (
                <>Check your<br /><span className="italic-gradient">email inbox.</span></>
              ) : (
                <>
                  {narrativeHeading.split("\n")[0]}<br />
                  <span className="italic-gradient">{narrativeHeading.split("\n")[1] || "in seconds."}</span>
                </>
              )}
            </h1>
            <p className="ap-narrative-p">
              {view === "check_email"
                ? "We've sent a confirmation link to your email. Click the link to activate your account and start creating."
                : narrativeText}
            </p>
            <div className="ap-narrative-features">
              {narrativeFeatures.map((f, i) => {
                const IconComp = iconMap[f.i] || Server;
                return (
                  <div key={i} className="ap-narrative-feat">
                    <div className="ap-narrative-feat-circle" style={{ background: "rgba(175,82,222,0.08)", color: "var(--purple)" }}>
                      <IconComp size={12} />
                    </div>
                    <span>{f.t}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* CARD SIDE */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <motion.div className="ap-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <AnimatePresence mode="wait">
                {view === "check_email" ? (
                  /* ═══════════ CHECK EMAIL VIEW ═══════════ */
                  <motion.div key="check_email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                    <div className="ap-card-head">
                      <motion.div
                        className="ap-card-ic"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                        style={{ background: "linear-gradient(135deg, #34c759, #30d158)" }}
                      >
                        <Inbox size={24} />
                      </motion.div>
                      <h2 className="ap-card-t">Verify your email</h2>
                      <p className="ap-card-s">We&apos;ve sent a confirmation link to</p>
                    </div>

                    {/* Email display */}
                    <div style={{
                      textAlign: "center",
                      padding: "16px 20px",
                      background: "var(--input)",
                      borderRadius: "12px",
                      marginBottom: "20px",
                      border: "1px solid var(--border)",
                    }}>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--t1)",
                        wordBreak: "break-all",
                      }}>
                        {submittedEmail}
                      </span>
                    </div>

                    {/* Next steps */}
                    <div style={{
                      padding: "16px",
                      background: "var(--input)",
                      borderRadius: "12px",
                      marginBottom: "24px",
                      border: "1px solid var(--border)",
                    }}>
                      <p style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--blue)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}>
                        <Mail size={12} />
                        Next steps
                      </p>
                      <ol style={{
                        fontSize: "13px",
                        color: "var(--t2)",
                        paddingLeft: "18px",
                        margin: 0,
                        lineHeight: 1.8,
                      }}>
                        <li>Open the confirmation email</li>
                        <li>Click the verification link</li>
                        <li>You&apos;ll be signed in automatically</li>
                      </ol>
                    </div>

                    {/* Info box */}
                    <div style={{
                      padding: "12px 14px",
                      background: "rgba(0, 113, 227, 0.05)",
                      border: "1px solid rgba(0, 113, 227, 0.15)",
                      borderRadius: "10px",
                      marginBottom: "20px",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}>
                      <CheckCircle2 size={14} style={{ color: "var(--blue)", marginTop: "2px", flexShrink: 0 }} />
                      <p style={{
                        fontSize: "12px",
                        color: "var(--t2)",
                        margin: 0,
                        lineHeight: 1.5,
                      }}>
                        Didn&apos;t receive it? Check your spam folder, or click below to resend.
                      </p>
                    </div>

                    {/* Resend button */}
                    <button
                      className="ap-btn"
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resending}
                      style={{
                        background: "var(--input)",
                        color: "var(--t1)",
                        boxShadow: "none",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {resending ? (
                        <><span className="ap-spin" style={{ borderTopColor: "var(--t1)" }} /> Resending...</>
                      ) : (
                        <><Mail size={14} /> Resend confirmation email</>
                      )}
                    </button>

                    <div className="ap-foot">
                      <Link href="/login" className="ap-a">
                        Back to Sign In
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  /* ═══════════ SIGNUP FORM VIEW ═══════════ */
                  <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                    <div className="ap-card-head">
                      <div className="ap-card-ic"><User size={24} /></div>
                      <h2 className="ap-card-t">Sign up</h2>
                      <p className="ap-card-s">Step {step} of 3 — {labels[step - 1]}</p>
                    </div>

                    <div className="ap-steps">
                      {[1, 2, 3].map((s, i) => (
                        <React.Fragment key={s}>
                          <div className={`ap-step ${s === step ? "on" : ""} ${s < step ? "done" : ""}`}>
                            <div className="ap-step-d">{s < step ? <Check size={12} /> : s}</div>
                            <span className="ap-step-l">{labels[i]}</span>
                          </div>
                          {i < 2 && <div className="ap-step-line"><div className="ap-step-line-fill" style={{ width: s < step ? "100%" : "0%" }} /></div>}
                        </React.Fragment>
                      ))}
                    </div>

                    {error && <div className="ap-berr">{error}</div>}

                    <AnimatePresence mode="wait">
                      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                        {step === 1 && (
                          <div className="ap-f">
                            <div className="ap-fi">
                              <span className="ap-ic"><User size={16} /></span>
                              <input className="ap-in" type="text" placeholder="Full name" value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFe({}); }} autoFocus required />
                            </div>
                            {fe.name && <div className="ap-err">{fe.name}</div>}
                          </div>
                        )}
                        {step === 2 && (
                          <div className="ap-f">
                            <div className="ap-fi">
                              <span className="ap-ic"><Mail size={16} /></span>
                              <input className="ap-in" type="email" placeholder="Work email" value={form.email} onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setFe({}); }} autoFocus required />
                            </div>
                            {fe.email && <div className="ap-err">{fe.email}</div>}
                          </div>
                        )}
                        {step === 3 && (
                          <>
                            <div className="ap-f">
                              <div className="ap-fi">
                                <span className="ap-ic"><Lock size={16} /></span>
                                <input className="ap-in" type={showPw ? "text" : "password"} placeholder="Password" value={form.password} onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setFe({}); }} autoFocus required />
                                <button type="button" className="ap-tog" onClick={() => setShowPw((v) => !v)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                              </div>
                              {fe.password && <div className="ap-err">{fe.password}</div>}
                              {form.password && (
                                <div className="ap-str">
                                  <div className="ap-str-bar">{[1, 2, 3, 4].map((i) => (<div key={i} className="ap-str-s" style={{ background: i <= str ? sC : undefined }} />))}</div>
                                  <div className="ap-str-t" style={{ color: sC }}>{sL}</div>
                                </div>
                              )}
                            </div>
                            <div className="ap-f">
                              <div className="ap-fi">
                                <span className="ap-ic"><Lock size={16} /></span>
                                <input className="ap-in" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => { setForm((f) => ({ ...f, confirmPassword: e.target.value })); setFe({}); }} required />
                              </div>
                              {fe.cp && <div className="ap-err">{fe.cp}</div>}
                            </div>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                      {step > 1 && (
                        <button className="ap-btn" type="button" onClick={() => setStep(step - 1)} style={{ width: 46, minWidth: 46, padding: 0, background: "var(--input)", color: "var(--t1)", boxShadow: "none" }}>
                          <ArrowLeft size={16} />
                        </button>
                      )}
                      <button className="ap-btn" type="button" onClick={next} disabled={loading}>
                        {loading ? <><span className="ap-spin" /></> : step < 3 ? <>Continue <ArrowRight size={14} /></> : "Create Account"}
                      </button>
                    </div>

                    <div className="ap-foot">Already have an account? <Link href="/login" className="ap-a">Sign in</Link></div>
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