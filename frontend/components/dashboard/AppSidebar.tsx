"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Plus, Compass, Settings, CreditCard,
  HelpCircle, LogOut, Sun, Moon,
  PanelLeftClose, PanelLeftOpen, BarChart3,
  ChevronRight, Command
} from "lucide-react";
import { config } from "@/lib/config";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { UsageWidget } from "@/components/dashboard/UsageWidget";

interface AppSidebarProps {
  profile?: any;
  userEmail?: string;
}

export function AppSidebar({ profile: initialProfile, userEmail: initialEmail }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; label: string } | null>(null);

  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [userEmail, setUserEmail] = useState<string>(initialEmail || "");

  const [appName, setAppName] = useState<string>(config.app.name || "PitchGenius");
  const [supportEmail, setSupportEmail] = useState<string>("support@pitchgenius.com");

  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("pitchgenius-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);

    const loadUserDataAndSettings = async () => {
      const { data: settings } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["app_name", "support_email"]);

      if (settings && settings.length > 0) {
        settings.forEach((s) => {
          if (s.key === "app_name" && s.value) setAppName(s.value);
          if (s.key === "support_email" && s.value) setSupportEmail(s.value);
        });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || initialEmail || "");

      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("id, full_name, email, plan, ppt_count_month, ai_credits_used")
        .eq("id", user.id)
        .single();

      if (freshProfile) setProfile(freshProfile);
    };

    loadUserDataAndSettings();
  }, [supabase, initialProfile, initialEmail]);

  // ★ FIXED: Safe Realtime channel creation with unique channel ID & cleanup
  useEffect(() => {
    if (!profile?.id) return;

    const channelName = `sidebar_rt_${profile.id}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => setProfile(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase]);

  const handleToggleCollapse = useCallback(() => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("pitchgenius-sidebar-collapsed", String(newState));
    window.dispatchEvent(new CustomEvent("sidebar-collapse-toggle", { detail: newState }));
  }, [collapsed]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleToggleCollapse]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  const displayName = profile?.full_name || userEmail?.split("@")[0] || "User";
  const userInitial = displayName[0]?.toUpperCase() || "U";
  const currentPlan = profile?.plan || "free";
  const isDark = mounted && resolvedTheme === "dark";

  const isActive = useCallback((href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href) || false;
  }, [pathname]);

  const mainNav = useMemo(() => [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "#0071e3" },
    { label: "Templates", href: "/dashboard/templates", icon: Compass, color: "#af52de" },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, color: "#30d158" },
  ], []);

  const settingsNav = useMemo(() => [
    { label: "Settings", href: "/dashboard/settings", icon: Settings, color: "#8e8e93" },
    { label: "Plans & Billing", href: "/dashboard/upgrade", icon: CreditCard, color: "#ff9500" },
    { label: "Help & Support", href: "/dashboard/help", icon: HelpCircle, color: "#8e8e93" },
  ], []);

  if (!mounted) return null;

  const handleMouseEnterItem = (key: string, label: string, e: React.MouseEvent) => {
    setHoveredItem(key);
    if (collapsed && sidebarRef.current) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltipPos({ top: rect.top + rect.height / 2, label });
    }
  };

  const handleMouseLeaveItem = () => {
    setHoveredItem(null);
    setTooltipPos(null);
  };

  // Shared nav item renderer
  const renderNavItem = (item: any, key: string, isExternal?: boolean) => {
    const active = isActive(item.href);
    const isHovered = hoveredItem === key;
    const El: any = isExternal ? "a" : Link;

    return (
      <div
        key={key}
        onMouseEnter={(e) => handleMouseEnterItem(key, item.label, e)}
        onMouseLeave={handleMouseLeaveItem}
        style={{ marginBottom: "2px", position: "relative" }}
      >
        <El
          href={item.href}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: collapsed ? "9px" : "8px 10px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: active ? 600 : 500,
            color: active
              ? (isDark ? "#f5f5f7" : "#1d1d1f")
              : isHovered
                ? (isDark ? "#e5e5e7" : "#3c3c43")
                : (isDark ? "#86868b" : "#6e6e73"),
            backgroundColor: active
              ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")
              : isHovered
                ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")
                : "transparent",
            textDecoration: "none",
            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            justifyContent: collapsed ? "center" : "flex-start",
            position: "relative",
          }}
        >
          {active && (
            <motion.div
              layoutId="sidebar-active-indicator"
              style={{
                position: "absolute",
                left: collapsed ? "50%" : "-1px",
                top: collapsed ? "-1px" : "50%",
                transform: collapsed ? "translateX(-50%)" : "translateY(-50%)",
                width: collapsed ? "20px" : "3px",
                height: collapsed ? "3px" : "18px",
                borderRadius: "999px",
                background: `linear-gradient(${collapsed ? "90deg" : "180deg"}, ${item.color}, ${item.color}90)`,
                boxShadow: `0 0 10px ${item.color}60`,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}

          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: active
                ? `linear-gradient(135deg, ${item.color}25, ${item.color}10)`
                : "transparent",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
          >
            <item.icon
              style={{
                width: "15px",
                height: "15px",
                color: active ? item.color : (isDark ? "#636366" : "#8e8e93"),
                transition: "color 0.2s ease",
              }}
              strokeWidth={active ? 2.5 : 2}
            />
          </div>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2, delay: 0.08 }}
                style={{ overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {!collapsed && isExternal && (
            <ChevronRight style={{ width: "11px", height: "11px", color: isDark ? "#3a3a3c" : "#c7c7cc", flexShrink: 0 }} />
          )}
        </El>
      </div>
    );
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: collapsed ? "72px" : "260px",
          zIndex: 40,
          transition: "width 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
          overflow: "visible",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
        }}
      >
        {/* Glass panel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "linear-gradient(180deg, rgba(15, 15, 20, 0.88) 0%, rgba(10, 10, 15, 0.92) 100%)"
              : "linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(250, 250, 252, 0.92) 100%)",
            backdropFilter: "saturate(180%) blur(24px)",
            WebkitBackdropFilter: "saturate(180%) blur(24px)",
            borderRight: isDark
              ? "1px solid rgba(255, 255, 255, 0.06)"
              : "1px solid rgba(0, 0, 0, 0.06)",
            overflow: "hidden",
          }}
        />

        {/* Top edge highlight */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: isDark
              ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)"
              : "linear-gradient(90deg, transparent, rgba(255, 255, 255, 1), transparent)",
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ═══════════ HEADER ═══════════ */}
          <div
            style={{
              height: "64px",
              padding: collapsed ? "0" : "0 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              flexShrink: 0,
            }}
          >
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ position: "relative" }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "-4px",
                    background: "linear-gradient(135deg, #0071e3, #af52de)",
                    filter: "blur(12px)",
                    opacity: 0.35,
                    borderRadius: "12px",
                  }}
                />
                <Logo className="relative h-8 w-8" />
              </motion.div>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.25, delay: 0.08 }}
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: isDark ? "#f5f5f7" : "#1d1d1f",
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {appName}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <AnimatePresence>
              {!collapsed && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleToggleCollapse}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  title="Collapse sidebar (⌘B)"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: isDark ? "#8e8e93" : "#6e6e73",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <PanelLeftClose style={{ width: "16px", height: "16px" }} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ═══════════ CREATE BUTTON ═══════════ */}
          <div style={{ padding: collapsed ? "8px" : "8px 14px" }}>
            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/editor/new"
                onMouseEnter={(e) => handleMouseEnterItem("new-deck", "New Deck", e)}
                onMouseLeave={handleMouseLeaveItem}
                className="group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  padding: collapsed ? "11px" : "10px 14px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  width: "100%",
                  boxShadow: "0 4px 14px -2px rgba(0, 119, 182, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Plus style={{ width: "15px", height: "15px", position: "relative", zIndex: 1 }} strokeWidth={2.5} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, delay: 0.08 }}
                      style={{ position: "relative", zIndex: 1, whiteSpace: "nowrap" }}
                    >
                      New Deck
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          </div>

          {/* ═══════════ NAVIGATION ═══════════ */}
          <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "4px 8px" : "4px 10px" }} className="ap-sidebar-nav">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.12 }}
                  style={{
                    padding: "14px 10px 6px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: isDark ? "#48484a" : "#aeaeb2",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Workspace
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginBottom: "14px" }}>
              {mainNav.map((item) => renderNavItem(item, item.href))}
            </div>

            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.12 }}
                  style={{
                    padding: "14px 10px 6px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: isDark ? "#48484a" : "#aeaeb2",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Account
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              {settingsNav.map((item, i) => renderNavItem(item, `settings-${i}`))}
            </div>
          </nav>

          {/* ═══════════ USAGE WIDGET ═══════════ */}
          {mounted && (
            <div style={{
              padding: collapsed ? "8px" : "8px 14px",
              borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)",
            }}>
              <UsageWidget profile={profile} collapsed={collapsed} />
            </div>
          )}

          {/* ═══════════ FOOTER USER BLOCK ═══════════ */}
          <div
            style={{
              padding: collapsed ? "12px 8px" : "14px 14px",
              borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: collapsed ? "column" : "row",
              alignItems: "center",
              gap: collapsed ? "8px" : "8px",
            }}
          >
            <Link
              href="/dashboard/settings"
              onMouseEnter={(e) => collapsed && handleMouseEnterItem("user", displayName, e)}
              onMouseLeave={handleMouseLeaveItem}
              style={{
                flex: collapsed ? "unset" : 1,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: collapsed ? "4px" : "6px 8px",
                borderRadius: "12px",
                textDecoration: "none",
                minWidth: 0,
                transition: "background-color 0.15s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)"; }}
              onBlur={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: "-2px",
                    borderRadius: "12px",
                    background: "conic-gradient(from 0deg, #0071e3, #af52de, #ff375f, #ff9500, #30d158, #0071e3)",
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: "-0.5px",
                    borderRadius: "11px",
                    background: isDark ? "#0f0f14" : "#ffffff",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0077B6, #00B4D8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  {userInitial}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.2, delay: 0.08 }}
                    style={{ minWidth: 0, flex: 1 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <p style={{
                        margin: 0,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: isDark ? "#f5f5f7" : "#1d1d1f",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        letterSpacing: "-0.01em",
                      }}>
                        {displayName}
                      </p>
                      {currentPlan !== "free" && (
                        <span
                          style={{
                            fontSize: "8px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            background: currentPlan === "pro"
                              ? "linear-gradient(135deg, #0071e3, #00B4D8)"
                              : "linear-gradient(135deg, #af52de, #ff375f)",
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {currentPlan}
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: "1px 0 0 0",
                      fontSize: "10px",
                      color: isDark ? "#636366" : "#8e8e93",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {userEmail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {!collapsed && (
              <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={toggleTheme}
                  title="Toggle theme"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {isDark ? <Sun style={{ width: "14px", height: "14px", color: "#fbbf24" }} strokeWidth={2.2} /> : <Moon style={{ width: "14px", height: "14px", color: "#6e6e73" }} strokeWidth={2.2} />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleLogout}
                  title="Sign out"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? "rgba(255,55,95,0.15)" : "rgba(255,55,95,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <LogOut style={{ width: "14px", height: "14px", color: "#ff375f" }} strokeWidth={2.2} />
                </motion.button>
              </div>
            )}

            {collapsed && (
              <>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={toggleTheme}
                  onMouseEnter={(e) => handleMouseEnterItem("theme", "Toggle Theme", e)}
                  onMouseLeave={handleMouseLeaveItem}
                  style={{
                    width: "36px", height: "30px", borderRadius: "8px", border: "none",
                    backgroundColor: "transparent", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer",
                  }}
                >
                  {isDark ? <Sun style={{ width: "14px", height: "14px", color: "#fbbf24" }} strokeWidth={2.2} /> : <Moon style={{ width: "14px", height: "14px", color: "#6e6e73" }} strokeWidth={2.2} />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleLogout}
                  onMouseEnter={(e) => handleMouseEnterItem("logout", "Sign Out", e)}
                  onMouseLeave={handleMouseLeaveItem}
                  style={{
                    width: "36px", height: "30px", borderRadius: "8px", border: "none",
                    backgroundColor: "transparent", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer",
                  }}
                >
                  <LogOut style={{ width: "14px", height: "14px", color: "#ff375f" }} strokeWidth={2.2} />
                </motion.button>
              </>
            )}
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{
                  padding: "6px 14px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "10px",
                  color: isDark ? "#48484a" : "#aeaeb2",
                  fontWeight: 500,
                }}
              >
                <span>Toggle sidebar</span>
                <kbd style={{
                  padding: "2px 5px",
                  borderRadius: "4px",
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                  fontSize: "9px",
                  fontFamily: "-apple-system, sans-serif",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1px",
                }}>
                  <Command style={{ width: "8px", height: "8px" }} strokeWidth={2.5} />B
                </kbd>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══════════ FLOATING EXPAND BUTTON ═══════════ */}
        <AnimatePresence>
          {collapsed && (
            <motion.button
              initial={{ opacity: 0, x: -8, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={handleToggleCollapse}
              whileHover={{ scale: 1.1, x: 2 }}
              whileTap={{ scale: 0.95 }}
              title="Expand sidebar (⌘B)"
              style={{
                position: "absolute",
                top: "80px",
                right: "-16px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                background: isDark
                  ? "linear-gradient(135deg, #1c1c1e, #2c2c2e)"
                  : "linear-gradient(135deg, #ffffff, #f5f5f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 50,
                color: isDark ? "#8e8e93" : "#6e6e73",
                boxShadow: isDark
                  ? "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)"
                  : "0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)",
              }}
            >
              <PanelLeftOpen style={{ width: "14px", height: "14px" }} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>
      </aside>

      {/* ═══════════ TOOLTIP ═══════════ */}
      <AnimatePresence>
        {collapsed && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.9 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              left: "84px",
              top: tooltipPos.top,
              transform: "translateY(-50%)",
              padding: "6px 12px",
              borderRadius: "8px",
              background: isDark ? "rgba(28, 28, 30, 0.95)" : "rgba(28, 28, 30, 0.95)",
              backdropFilter: "blur(20px)",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              pointerEvents: "none",
              zIndex: 100,
              whiteSpace: "nowrap",
            }}
          >
            {tooltipPos.label}
            <div style={{
              position: "absolute",
              left: "-4px",
              top: "50%",
              transform: "translateY(-50%) rotate(45deg)",
              width: "8px",
              height: "8px",
              background: isDark ? "rgba(28, 28, 30, 0.95)" : "rgba(28, 28, 30, 0.95)",
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .ap-sidebar-nav::-webkit-scrollbar { width: 4px; }
        .ap-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .ap-sidebar-nav::-webkit-scrollbar-thumb {
          background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"};
          border-radius: 4px;
        }
        .ap-sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"};
        }
      `}</style>
    </>
  );
}