"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, KeyRound, Crown, Trash2, Save, Loader2, AlertCircle, CheckCircle2,
  Eye, EyeOff, CreditCard, Shield, Pencil, Check, X, Sparkles, Sun, Moon, Monitor,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";
import { ManageBillingButton } from "@/components/dashboard/ManageBillingButton";
import { useTheme } from "@/components/theme/ThemeProvider";
import { loadPlanLimitsFromDB } from "@/lib/quota";
import { toast } from "sonner";

const SkeletonBox = ({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`bg-slate-200/70 dark:bg-slate-800/70 rounded-lg animate-pulse ${className}`} style={style} />
);

export default function AccountSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { mode, setMode, resolvedTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [userId, setUserId] = useState("");

  const [dbPlans, setDbPlans] = useState<any[]>([]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setEmail(user.email || "");
      setUserId(user.id);

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      if (profile) {
        const resolvedName = profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "";
        setFullName(resolvedName);
        setTempName(resolvedName);
        setPlan(profile.plan || "free");
      }

      await loadPlanLimitsFromDB();

      const { data: pricingPlans, error: pricingError } = await supabase.from("pricing").select("*").eq("is_active", true);

      if (!pricingError && pricingPlans && pricingPlans.length > 0) {
        const sorted = [...pricingPlans].sort((a, b) => (a.price_monthly || 0) - (b.price_monthly || 0));
        setDbPlans(sorted);
      } else {
        setDbPlans([
          { plan_name: "free", price_monthly: 0, features: ["5 presentations/month", "Up to 10 slides/deck", "Standard AI support"] },
          { plan_name: "pro", price_monthly: 9, features: ["Unlimited presentations", "Up to 30 slides/deck", "Priority AI response"] },
          { plan_name: "team", price_monthly: 19, features: ["Everything in Pro", "Up to 50 slides/deck", "Dedicated workspace"] },
        ]);
      }

      setLoading(false);
    }
    loadData();
  }, [supabase, router]);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setErrorMsg(null); setTimeout(() => setSuccessMsg(null), 4000); };
  const showError = (msg: string) => { setErrorMsg(msg); setSuccessMsg(null); };

  const handleSaveName = async () => {
    if (!tempName.trim()) { showError("Name cannot be empty."); return; }
    setSaving(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ data: { full_name: tempName.trim() } });
      if (authError) throw authError;
      const { error: profileError } = await supabase.from("profiles").update({ full_name: tempName.trim() }).eq("id", userId);
      if (profileError) console.warn("Profile table update warning:", profileError.message);
      setFullName(tempName.trim());
      setEditingName(false);
      toast.success("Name updated successfully!", { duration: 2000 });
      router.refresh();
    } catch (err: any) {
      showError(err?.message || "Failed to update name.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { showError("Min 8 characters."); return; }
    if (newPassword !== confirmPassword) { showError("Passwords don't match."); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showSuccess("Password changed successfully!");
      setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      showError(err?.message || "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") { showError('Type "DELETE" to confirm.'); return; }
    setDeleting(true);
    try {
      await supabase.from("presentations").delete().eq("user_id", userId);
      await supabase.from("user_usage").delete().eq("user_id", userId);
      await supabase.from("subscriptions").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);

      try {
        const { data: settingData } = await supabase.from("settings").select("value").eq("key", "backend_url").maybeSingle();
        const backendUrl = settingData?.value || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        await fetch(`${backendUrl}/api/v1/auth/delete-account`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
      } catch (backendErr) { console.warn("Backend deletion failed:", backendErr); }

      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err: any) {
      console.error("Delete account error:", err);
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  const themeOptions = [
    { key: "light" as const, label: "Light", icon: Sun, description: "Clean white interface", preview: { bg: "#ffffff", sidebar: "#f8fafc", card: "#ffffff", text: "#1d1d1f", border: "#e2e8f0", accent: "#0077B6" } },
    { key: "dark" as const, label: "Dark", icon: Moon, description: "Easy on the eyes", preview: { bg: "#0f172a", sidebar: "#080c16", card: "#1e293b", text: "#f1f5f9", border: "#334155", accent: "#38bdf8" } },
    { key: "system" as const, label: "System", icon: Monitor, description: "Follows OS preference", preview: { bg: "linear-gradient(135deg, #ffffff 50%, #0f172a 50%)", sidebar: "linear-gradient(135deg, #f8fafc 50%, #080c16 50%)", card: "linear-gradient(135deg, #ffffff 50%, #1e293b 50%)", text: "#6e6e73", border: "#94a3b8", accent: "#0077B6" } },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 font-sans">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">Configuration</span>
        <h1 className="hero-heading text-3xl md:text-4xl text-slate-900 dark:text-white mt-1">Account Settings</h1>
      </div>

      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-xs text-emerald-600 font-semibold font-sans">
          <CheckCircle2 className="h-4 w-4 shrink-0" /><span>{successMsg}</span>
        </motion.div>
      )}
      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 rounded-2xl border border-red-500/10 bg-red-500/5 p-4 text-xs text-red-500 font-sans">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMsg}</span>
        </motion.div>
      )}

      {/* PROFILE NAME */}
      <section className="apple-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600"><User className="h-5 w-5" /></div>
          <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">Personal details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</label>
            {loading ? (
              <SkeletonBox className="h-12 rounded-full w-full" />
            ) : editingName ? (
              <div className="flex items-center gap-2">
                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} autoFocus className="flex-1 px-4 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-cyan-500 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-sans" />
                <button onClick={handleSaveName} disabled={saving} className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={3} />}
                </button>
                <button onClick={() => { setEditingName(false); setTempName(fullName); }} className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-sans">
                  {fullName || <span className="text-slate-400 italic font-sans">No name set</span>}
                </div>
                <button onClick={() => setEditingName(true)} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</label>
            {loading ? <SkeletonBox className="h-12 rounded-full w-full" /> : (
              <input type="email" value={email} disabled className="w-full px-4 py-3 rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 text-sm cursor-not-allowed border border-slate-100 dark:border-slate-800 font-sans" />
            )}
          </div>
        </div>
      </section>

      {/* APPEARANCE */}
      <section className="apple-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {resolvedTheme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">Appearance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize how PitchGenius looks on your device</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const isSelected = mode === option.key;
            const Icon = option.icon;
            return (
              <button key={option.key} onClick={() => { setMode(option.key); toast.success(`Theme set to ${option.label}`, { duration: 1500 }); }} className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all ${isSelected ? "border-cyan-500 shadow-lg shadow-cyan-500/10" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                <div className="h-24 relative overflow-hidden" style={{ background: option.preview.bg }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "28%", background: option.preview.sidebar, borderRight: `1px solid ${option.preview.border}` }}>
                    <div style={{ padding: "8px 4px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ height: "3px", width: "60%", borderRadius: "2px", backgroundColor: option.preview.accent, margin: "0 auto" }} />
                      <div style={{ height: "2px", width: "50%", borderRadius: "2px", backgroundColor: option.preview.border, margin: "0 auto" }} />
                    </div>
                  </div>
                  <div style={{ marginLeft: "28%", padding: "8px" }}>
                    <div style={{ height: "4px", width: "60%", borderRadius: "2px", backgroundColor: option.preview.text, opacity: 0.3, marginBottom: "6px" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                      <div style={{ height: "20px", borderRadius: "3px", backgroundColor: option.preview.card, border: `1px solid ${option.preview.border}` }} />
                      <div style={{ height: "20px", borderRadius: "3px", backgroundColor: option.preview.card, border: `1px solid ${option.preview.border}` }} />
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon style={{ width: "14px", height: "14px", color: isSelected ? "#0077B6" : "#94a3b8" }} />
                      <span className={`text-xs font-bold ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>{option.label}</span>
                    </div>
                    {isSelected && (<div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" strokeWidth={3} /></div>)}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* DYNAMIC PLAN & SUBSCRIPTION */}
      <section className="apple-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600"><Crown className="h-5 w-5" /></div>
          <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">Plan & Subscription</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <SkeletonBox className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1 flex-1">
                    <SkeletonBox className="h-3 w-16" />
                    <SkeletonBox className="h-2 w-12" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <SkeletonBox className="w-3 h-3 rounded-full" />
                      <SkeletonBox className="h-2 flex-1" />
                    </div>
                  ))}
                </div>
                <SkeletonBox className="h-10 w-full rounded-full" />
              </div>
            ))
          ) : (
            dbPlans.map((p) => {
              const isCurrent = p.plan_name === plan;
              const isPro = p.plan_name === "pro";
              const isTeam = p.plan_name === "team";
              const rawFeatures = p.features;
              const featuresList = Array.isArray(rawFeatures) ? rawFeatures.slice(0, 4) : [];

              return (
                <div key={p.plan_name} className={`p-5 rounded-2xl border transition-all ${isCurrent ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-2 ring-emerald-500/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: isPro ? "#0071e3" : isTeam ? "#af52de" : "#8e8e93" }}>
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">{p.plan_name}</h4>
                        <p className="text-xs font-bold" style={{ color: isPro ? "#0071e3" : isTeam ? "#af52de" : "#8e8e93" }}>${p.price_monthly || 0}/mo</p>
                      </div>
                    </div>
                    {isCurrent && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white">Active</span>}
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {featuresList.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color: isPro ? "#0071e3" : isTeam ? "#af52de" : "#8e8e93" }} strokeWidth={3} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    plan !== "free" ? <ManageBillingButton /> : (
                      <div className="text-center py-2 text-[10px] text-slate-400 font-semibold">Current Plan</div>
                    )
                  ) : p.plan_name !== "free" ? (
                    <UpgradeButton plan={p.plan_name} label={`Upgrade to ${p.plan_name.charAt(0).toUpperCase() + p.plan_name.slice(1)}`} variant="gradient" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        <Link href="/dashboard/upgrade" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
          <Sparkles className="w-3 h-3" /> Compare all plan features →
        </Link>
      </section>

      {/* SECURITY & PASSWORD */}
      <section className="apple-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600"><KeyRound className="h-5 w-5" /></div>
          <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white">Security & Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">New Password</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" tabIndex={-1}>{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confirm</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" tabIndex={-1}>{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <button type="submit" disabled={changingPassword} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold disabled:opacity-50 font-sans">
            {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <KeyRound className="h-3.5 w-3.5 mr-1" />} Update Password
          </button>
        </form>
      </section>

      {/* DANGER ZONE */}
      <section className="apple-card p-6 md:p-8 space-y-6 border border-red-200/50 dark:border-red-900/10 bg-red-500/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><Shield className="h-5 w-5" /></div>
          <h2 className="text-lg font-bold font-display text-red-500">Danger Zone</h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl border border-red-100 dark:border-red-950/20 bg-red-500/[0.02]">
          <div>
            <div className="text-sm font-bold text-red-600">Delete Account</div>
            <div className="text-xs text-slate-500">Permanently delete all data.</div>
          </div>
          <button onClick={() => setDeleteConfirm(deleteConfirm === "" ? "DELETE" : "")} className="px-4 py-2 rounded-full bg-red-500/10 text-red-600 text-xs font-bold hover:bg-red-500/20">
            <Trash2 className="h-3.5 w-3.5 inline mr-1" /> Delete
          </button>
        </div>
        {deleteConfirm !== "" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3 font-sans">
            <p className="text-xs text-red-600 font-semibold">Type <strong>DELETE</strong> to confirm:</p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type DELETE" className="w-full py-4  px-2 rounded-full border border-red-200 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
            <button onClick={handleDeleteAccount} disabled={deleting || deleteConfirm !== "DELETE"} className="px-5 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50">{deleting ? "Deleting..." : "Confirm Delete"}</button>
          </motion.div>
        )}
      </section>
    </div>
  );
}