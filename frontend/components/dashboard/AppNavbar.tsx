"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Sun, Moon, LogOut, Settings, LayoutDashboard, Plus, ChevronDown,
  Crown, HelpCircle, CreditCard, Zap, Compass
} from "lucide-react";
import { config } from "@/lib/config";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

interface AppNavbarProps {
  profile?: any;
  userEmail?: string;
}

export function AppNavbar({ profile, userEmail }: AppNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [supportEmail, setSupportEmail] = useState("support@pitchgenius.com");
  const [appName, setAppName] = useState(config.app.name || "PitchGenius");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAuthUser(user);

      // ★ DYNAMIC SETTINGS QUERY: Fetch live app name & support email from DB
      const { data: settings } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["support_email", "app_name"]);

      if (settings && settings.length > 0) {
        settings.forEach((s) => {
          if (s.key === "support_email" && s.value) setSupportEmail(s.value);
          if (s.key === "app_name" && s.value) setAppName(s.value);
        });
      }
    }

    initData();

    return () => window.removeEventListener("scroll", onScroll);
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const displayName = 
    profile?.full_name || 
    authUser?.user_metadata?.full_name || 
    authUser?.user_metadata?.name || 
    userEmail?.split("@")[0] || 
    "User";

  const userInitial = displayName[0]?.toUpperCase() || "U";
  const currentPlan = profile?.plan || "free";

  const appLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Templates", href: "/dashboard/templates", icon: Compass },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href);
  };

  const isDark = mounted && theme === "dark";
  const navBg = isDark ? "#0b0f19" : "#ffffff";
  const navBorder = isDark ? "#1e293b" : "#e2e8f0";
  const textColor = isDark ? "#f1f5f9" : "#0f172a";
  const subtextColor = isDark ? "#94a3b8" : "#64748b";
  const buttonBorder = isDark ? "#334155" : "#cbd5e1";
  const buttonHoverBg = isDark ? "#1e293b" : "#f1f5f9";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "64px",
        backgroundColor: navBg,
        borderBottom: `1px solid ${navBorder}`,
        boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 1px 10px rgba(0,0,0,0.03)",
        display: "flex",
        alignItems: "center",
        transition: "all 0.2s ease-in-out",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-6 w-full flex items-center justify-between">
        
        {/* ─── LEFT SIDE: Logo & Primary Pages ─── */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0" style={{ textDecoration: "none" }}>
            <Logo className="h-9 w-9 transition-transform group-hover:scale-105" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-base" style={{ color: textColor }}>
                {appName}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#94a3b8" }}>
                Studio
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {appLinks.map((link) => {
              const isActive = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all text-decoration-none`}
                  style={{
                    backgroundColor: isActive ? (isDark ? "#1e293b" : "#f1f5f9") : "transparent",
                    color: isActive ? textColor : subtextColor
                  }}
                >
                  <link.icon style={{ width: "14px", height: "14px" }} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ─── RIGHT SIDE: Tools ─── */}
        <div className="flex items-center gap-3">
          
          {/* Create presentation CTA */}
          <Link
            href="/editor/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "999px",
              backgroundColor: "#0077B6",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0, 119, 182, 0.2)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#005f92";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#0077B6";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <Plus style={{ width: "15px", height: "16px", color: "#ffffff" }} strokeWidth={2.8} />
            <span>Create</span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              border: `1.5px solid ${buttonBorder}`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = buttonHoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun style={{ width: "16px", height: "16px", color: "#fbbf24" }} />
            ) : (
              <Moon style={{ width: "16px", height: "16px", color: "#475569" }} />
            )}
          </button>

          {/* User Profile dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "3px 10px 3px 3px",
                borderRadius: "999px",
                backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                border: userMenuOpen 
                  ? "2px solid #0077B6" 
                  : `2px solid ${isDark ? "#334155" : "#b0b9c6"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div 
                style={{
                  width: "28px",
                  height: "30px",
                  borderRadius: "999px",
                  background: "linear-gradient(135deg, #0077B6 0%, #00B4D8 50%, #90E0EF 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2)",
                }}
              >
                {userInitial}
              </div>
              
              <ChevronDown 
                style={{ 
                  width: "14px", 
                  height: "14px", 
                  color: isDark ? "#cbd5e1" : "#475569",
                  transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }} 
              />
            </button>

            {/* Dropdown Menu Portal */}
            {userMenuOpen && (
              <div 
                style={{
                  position: "absolute",
                  right: 0,
                  top: "52px",
                  width: "280px",
                  borderRadius: "20px",
                  border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  boxShadow: isDark 
                    ? "0 20px 50px rgba(0,0,0,0.4)" 
                    : "0 20px 50px rgba(15, 23, 42, 0.08)",
                  overflow: "hidden",
                  zIndex: 100,
                }}
              >
                {/* Header Information Card */}
                <div 
                  style={{ 
                    padding: "16px", 
                    borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                    background: isDark ? "rgba(255,255,255,0.01)" : "#f8fafc"
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: textColor }}>
                    {displayName}
                  </p>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: subtextColor }} className="truncate">
                    {userEmail}
                  </p>
                  
                  <div className="mt-2.5">
                    <span 
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "9px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background: currentPlan === "free"
                          ? (isDark ? "#1e293b" : "#e2e8f0")
                          : "linear-gradient(135deg, #f59e0b, #f97316)",
                        color: currentPlan === "free"
                          ? subtextColor
                          : "#ffffff",
                      }}
                    >
                      {currentPlan === "free" ? (
                        <Zap style={{ width: "9px", height: "10px" }} />
                      ) : (
                        <Crown style={{ width: "9px", height: "10px" }} />
                      )}
                      {currentPlan} plan
                    </span>
                  </div>
                </div>

                {/* Submenu Link Items */}
                <div style={{ padding: "6px" }} className="space-y-0.5">
                  {[
                    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
                    { href: "/dashboard/settings", icon: Settings, label: "Account Settings" },
                    { href: "/dashboard/settings", icon: CreditCard, label: "Billing & Plans" },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: textColor,
                        textDecoration: "none",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <item.icon style={{ width: "16px", height: "16px", color: subtextColor }} />
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  <a
                    href={`mailto:${supportEmail}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: textColor,
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <HelpCircle style={{ width: "16px", height: "16px", color: subtextColor }} />
                    <span>Help & Support</span>
                  </a>
                </div>

                {/* Dropdown Action: Sign Out */}
                <div 
                  style={{ 
                    padding: "6px", 
                    borderTop: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}` 
                  }}
                >
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#dc2626",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark
                        ? "rgba(220, 38, 38, 0.1)"
                        : "#fef2f2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <LogOut style={{ width: "16px", height: "16px", color: "#dc2626" }} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}