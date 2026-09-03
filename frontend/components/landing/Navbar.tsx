"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Sun, Moon, LogOut, Settings } from "lucide-react";
import { config } from "@/lib/config";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

interface NavLinkItem {
  label: string;
  href: string;
}

const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const [appName, setAppName] = useState<string>(config.app.name || "PitchGenius");
  const [navLinks, setNavLinks] = useState<NavLinkItem[]>(DEFAULT_NAV_LINKS);

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    async function loadNavSettings() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["app_name", "navbar_links"]);

        if (settings && settings.length > 0) {
          settings.forEach((s) => {
            if (s.key === "app_name" && s.value) setAppName(s.value);
            if (s.key === "navbar_links" && s.value) {
              try {
                const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
                if (Array.isArray(parsed) && parsed.length > 0) setNavLinks(parsed);
              } catch (e) {
                console.warn("Could not parse navbar_links JSON:", e);
              }
            }
          });
        }
      } catch (err) {
        console.warn("Failed to load navbar settings:", err);
      }
    }

    loadNavSettings();
  }, [supabase]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <nav className={`apple-nav ${scrolled ? "shadow-sm" : ""}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Logo className="h-8 w-8 transition-transform group-hover:scale-105" />
            <span className="font-display font-semibold text-lg text-slate-900 dark:text-white">
              {appName}
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && (
                isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )
              )}
            </button>

            {/* Auth-aware buttons — NO Dashboard button */}
            {!authLoading && (
              <>
                {user ? (
                  /* ── LOGGED IN STATE — Just show Sign Out ── */
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      onClick={handleLogout}
                      className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-2"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  /* ── LOGGED OUT STATE ── */
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      href="/login"
                      className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-2"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="text-sm font-medium px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-transform"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-slate-600 dark:text-slate-300 py-2.5"
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-2">
              {!authLoading && (
                <>
                  {user ? (
                    <button
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="flex items-center gap-3 py-2.5 text-sm text-red-500 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="block w-full text-center text-sm text-slate-600 dark:text-slate-300 py-2 border border-slate-200 dark:border-slate-700 rounded-full"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileOpen(false)}
                        className="block w-full text-center text-sm font-medium py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}