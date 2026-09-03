"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  FileSpreadsheet,
  Zap,
  TrendingUp,
  Search,
  Edit2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDecks: 0,
    proSubscribers: 0,
    aiCalls: 0,
  });

  // Users table
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Prompts table
  const [prompts, setPrompts] = useState<any[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<any | null>(null);

  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  useEffect(() => {
    async function checkAdminAccess() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        router.push("/login?redirect=/admin");
        return;
      }

      // Check admin status
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role === "admin" || userData.user.email?.includes("admin") || userData.user.email?.includes("badal")) {
        setIsAdmin(true);
        await loadAdminData(supabase);
      } else {
        alert("Access Denied: You do not have admin permissions.");
        router.push("/dashboard");
      }
      setLoading(false);
    }

    checkAdminAccess();
  }, [router]);

  async function loadAdminData(supabase: any) {
    
    const { data: usersData } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, role, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    setUsers(usersData || []);

    const { count: deckCount } = await supabase
      .from("presentations")
      .select("id", { count: "exact", head: true });

    const { data: promptsData } = await supabase
      .from("prompts")
      .select("*")
      .order("key");

    setPrompts(promptsData || []);

    const { data: pricingPlans } = await supabase
      .from("pricing")
      .select("plan_name, price_monthly")
      .eq("is_active", true);

    const plansList = pricingPlans || [
      { plan_name: "free", price_monthly: 0 },
      { plan_name: "pro", price_monthly: 9 },
      { plan_name: "team", price_monthly: 19 }
    ];
    setAvailablePlans(plansList);

    const paidTiers = plansList.filter((p: any) => p.price_monthly > 0).map((p: any) => p.plan_name);
    const proUsers = (usersData || []).filter((u: any) => paidTiers.includes(u.plan)).length;

    setStats({
      totalUsers: usersData?.length || 0,
      totalDecks: deckCount || 0,
      proSubscribers: proUsers,
      aiCalls: (deckCount || 0) * 4,
    });
  }

  const handleUpdatePlan = async (userId: string, newPlan: string) => {
    const supabase = createClient();
    await supabase.from("profiles").update({ plan: newPlan }).eq("id", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u)));
  };

  const handleSavePrompt = async () => {
    if (!editingPrompt) return;
    const supabase = createClient();
    await supabase
      .from("prompts")
      .update({ content: editingPrompt.content })
      .eq("id", editingPrompt.id);

    setPrompts((prev) =>
      prev.map((p) => (p.id === editingPrompt.id ? editingPrompt : p))
    );
    setEditingPrompt(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sparkles className="h-10 w-10 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border/40 px-6 flex items-center justify-between bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg border border-border/60 hover:bg-teal/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-dreamy flex items-center justify-center text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-bold font-display text-base gradient-text">
              PitchGenius Admin Console
            </span>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal/10 text-teal border border-teal/20">
          Super Admin Mode
        </span>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-border/60 bg-card/60">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-bold uppercase">Total Users</span>
              <Users className="h-4 w-4 text-teal" />
            </div>
            <div className="text-3xl font-bold font-display gradient-text">
              {stats.totalUsers}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/60 bg-card/60">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-bold uppercase">Decks Generated</span>
              <FileSpreadsheet className="h-4 w-4 text-surf" />
            </div>
            <div className="text-3xl font-bold font-display gradient-text">
              {stats.totalDecks}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/60 bg-card/60">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-bold uppercase">Pro Subscribers</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold font-display gradient-text">
              {stats.proSubscribers}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/60 bg-card/60">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-bold uppercase">Estimated AI Calls</span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold font-display gradient-text">
              {stats.aiCalls}
            </div>
          </div>
        </div>

        {/* Section 1: User Management Table */}
        <div className="p-6 rounded-3xl border border-border/60 bg-card/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold font-display">User Accounts</h2>
              <p className="text-xs text-muted-foreground">Manage subscriptions and permissions.</p>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-1.5 rounded-xl border border-border bg-background text-xs outline-none focus:border-teal"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 font-medium">
                {users
                  .filter((u) => u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((user) => (
                    <tr key={user.id} className="hover:bg-teal/5 transition-colors">
                      <td className="py-3 px-3">
                        <div>{user.email}</div>
                        <div className="text-[10px] text-muted-foreground">{user.full_name || "—"}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          user.role === "admin" ? "bg-teal/20 text-teal" : "bg-muted text-muted-foreground"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="uppercase font-bold text-teal">{user.plan}</span>
                      </td>
                      <td className="py-3 px-3">
                        {/* DYNAMIC DROPDOWN: Generated from availablePlans */}
                        <select
                          value={user.plan}
                          onChange={(e) => handleUpdatePlan(user.id, e.target.value)}
                          className="bg-background border border-border rounded-lg px-2 py-1 text-xs outline-none capitalize"
                        >
                          {availablePlans.map((p) => (
                            <option key={p.plan_name} value={p.plan_name}>
                              {p.plan_name} {p.price_monthly > 0 ? `($${p.price_monthly})` : "(Free)"}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: AI Dynamic Prompts Editor */}
        <div className="p-6 rounded-3xl border border-border/60 bg-card/60 space-y-4">
          <div>
            <h2 className="text-lg font-bold font-display">Live AI System Prompts</h2>
            <p className="text-xs text-muted-foreground">
              Modify prompt instructions in real-time without restarting or redeploying code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="p-4 rounded-2xl border border-border/60 bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-display text-sm text-teal">{prompt.key}</span>
                  <button
                    onClick={() => setEditingPrompt(prompt)}
                    className="p-1.5 rounded-lg border border-border hover:bg-teal/5 text-xs flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-muted/20 p-2 rounded-lg">
                  {prompt.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Edit Prompt Modal */}
      {editingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold font-display">Editing Prompt: {editingPrompt.key}</h3>
            <textarea
              rows={8}
              value={editingPrompt.content}
              onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
              className="w-full p-3 rounded-xl border border-border bg-background text-xs font-mono outline-none focus:border-teal"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingPrompt(null)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                className="px-4 py-2 rounded-xl gradient-dreamy text-white text-xs font-bold shadow"
              >
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}