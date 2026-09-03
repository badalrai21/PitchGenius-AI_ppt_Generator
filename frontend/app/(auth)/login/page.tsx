"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Mail, Lock, Eye, EyeOff, Shield, Terminal, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
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

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("/dashboard");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fe, setFe] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [rm, setRm] = useState(true);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const [appName, setAppName] = useState("PitchGenius");
  const [narrativeHeading, setNarrativeHeading] = useState("Welcome back to\nyour workspace.");
  const [narrativeText, setNarrativeText] = useState("Continue creating stunning presentations. Your AI-powered design studio is ready.");
  const [narrativeFeatures, setNarrativeFeatures] = useState([
    { t: "AI-generated slide layouts", i: "Shield" },
    { t: "Real-time cloud sync", i: "Terminal" },
  ]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try { const p = new URLSearchParams(window.location.search); const d = p.get("redirect"); if (d) setRedirectUrl(d); } catch {}
    }
    const fn = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", fn);

    async function loadSettings() {
      try {
        const { data: settings } = await supabase.from("settings").select("key, value").in("key", ["app_name", "login_narrative_heading", "login_narrative_text", "login_narrative_features"]);
        if (settings) {
          settings.forEach((s) => {
            if (s.key === "app_name" && s.value) setAppName(s.value);
            if (s.key === "login_narrative_heading" && s.value) setNarrativeHeading(s.value);
            if (s.key === "login_narrative_text" && s.value) setNarrativeText(s.value);
            if (s.key === "login_narrative_features" && s.value) {
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Required";
    setFe(e); return !Object.keys(e).length;
  };

  const submit = async (ev: React.FormEvent) => {
  ev.preventDefault(); setError("");
  if (!validate()) return;
  setLoading(true);
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(), 
      password: form.password,
    });
    if (authError) {
      setError(authError.message.toLowerCase().includes("invalid") ? "Incorrect email or password" : authError.message);
      setLoading(false); 
      return;
    }
    if (data?.session) { 
      toast.success("Welcome back!"); 
      window.location.href = redirectUrl; // Uses "/dashboard" by default
    } else {
      setLoading(false); 
    }
  } catch (err: any) { 
    setError(err?.message || "Login failed"); 
    setLoading(false); 
  }
};

  const oauth = async (provider: "google" | "github") => {
    setError("");
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (oauthError) { setError(oauthError.message); return; }
      if (data?.url) window.location.href = data.url;
    } catch (err: any) { setError(err?.message || "OAuth failed"); }
  };

  const iconMap: Record<string, any> = { Shield, Terminal };

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
          <Link href="/signup" className="ap-nav-a ap-nav-cta">Create Account</Link>
          <div className="ap-nav-divider" />
          <button type="button" className="ap-theme-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </nav>

      <div className="ap-auth-split-wrapper">
        <div className="ap-auth-inner-split">
          <motion.div className="ap-auth-side-narrative" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <span className="ap-narrative-eyebrow">Enterprise Identity</span>
            <h1 className="ap-narrative-h1">
              {narrativeHeading.split("\n")[0]}<br />
              <span className="italic-gradient">{narrativeHeading.split("\n")[1] || "workspace."}</span>
            </h1>
            <p className="ap-narrative-p">{narrativeText}</p>
            <div className="ap-narrative-features">
              {narrativeFeatures.map((f, i) => {
                const IconComp = iconMap[f.i] || Shield;
                return (
                  <div key={i} className="ap-narrative-feat">
                    <div className="ap-narrative-feat-circle"><IconComp size={12} /></div>
                    <span>{f.t}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <motion.div className="ap-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <div className="ap-card-head">
                <div className="ap-card-ic"><Lock size={24} /></div>
                <h2 className="ap-card-t">Welcome back</h2>
                <p className="ap-card-s">Sign in to your account</p>
              </div>

              <form onSubmit={submit}>
                <div className="ap-f">
                  <div className="ap-fi">
                    <span className="ap-ic"><Mail size={16} /></span>
                    <input className="ap-in" type="email" placeholder="Email address" value={form.email} onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setFe((f) => ({ ...f, email: "" })); }} required />
                  </div>
                  {fe.email && <div className="ap-err">{fe.email}</div>}
                </div>

                <div className="ap-f">
                  <div className="ap-fi">
                    <span className="ap-ic"><Lock size={16} /></span>
                    <input className="ap-in" type={showPw ? "text" : "password"} placeholder="Password" value={form.password} onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setFe((f) => ({ ...f, password: "" })); }} required />
                    <button type="button" className="ap-tog" onClick={() => setShowPw((v) => !v)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                  {fe.password && <div className="ap-err">{fe.password}</div>}
                </div>

                <div className="ap-row">
                  <label className="ap-chk">
                    <input type="checkbox" className="ap-chk-b" checked={rm} onChange={(e) => setRm(e.target.checked)} />
                    <span className="ap-chk-l">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="ap-a">Forgot password?</Link>
                </div>

                {error && <div className="ap-berr">{error}</div>}

                <button className="ap-btn" type="submit" disabled={loading}>
                  {loading ? <><span className="ap-spin" /> Signing in…</> : "Sign In"}
                </button>
              </form>

              <div className="ap-div">or</div>
              <div className="ap-oauth">
                <button className="ap-oa" type="button" onClick={() => oauth("google")}>
                  <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </button>
                <button className="ap-oa" type="button" onClick={() => oauth("github")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                  GitHub
                </button>
              </div>

              <div className="ap-foot">Don&apos;t have an account? <Link href="/signup" className="ap-a">Create account</Link></div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}