"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Twitter, Github, Linkedin, Youtube } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLink {
  iconName: string;
  href: string;
  label: string;
}

const SOCIAL_ICON_MAP: Record<string, any> = {
  Twitter,
  Github,
  Linkedin,
  Youtube,
};

const DEFAULT_FOOTER_LINKS: Record<string, FooterLink[]> = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Templates", href: "/dashboard/templates" },
    { label: "Changelog", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Community", href: "#" },
    { label: "API", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

const DEFAULT_SOCIAL: SocialLink[] = [
  { iconName: "Twitter", href: "#", label: "Twitter" },
  { iconName: "Github", href: "#", label: "GitHub" },
  { iconName: "Linkedin", href: "#", label: "LinkedIn" },
  { iconName: "Youtube", href: "#", label: "YouTube" },
];

export function Footer() {
  const [appName, setAppName] = useState<string>(config.app.name || "PitchGenius");
  const [footerDesc, setFooterDesc] = useState<string>("Create stunning presentations in seconds with the power of AI.");
  const [footerLinks, setFooterLinks] = useState<Record<string, FooterLink[]>>(DEFAULT_FOOTER_LINKS);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(DEFAULT_SOCIAL);
  const [systemStatus, setSystemStatus] = useState<string>("All systems operational");

  const supabase = createClient();

  useEffect(() => {
    async function loadFooterConfig() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", [
            "app_name",
            "footer_description",
            "footer_links",
            "social_links",
            "system_status_text",
          ]);

        if (settings && settings.length > 0) {
          settings.forEach((s) => {
            if (s.key === "app_name" && s.value) setAppName(s.value);
            if (s.key === "footer_description" && s.value) setFooterDesc(s.value);
            if (s.key === "system_status_text" && s.value) setSystemStatus(s.value);

            if (s.key === "footer_links" && s.value) {
              try {
                const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
                if (parsed && typeof parsed === "object") setFooterLinks(parsed);
              } catch (e) {
                console.warn("Could not parse footer_links JSON:", e);
              }
            }

            if (s.key === "social_links" && s.value) {
              try {
                const parsedSocial = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
                if (Array.isArray(parsedSocial) && parsedSocial.length > 0) setSocialLinks(parsedSocial);
              } catch (e) {
                console.warn("Could not parse social_links JSON:", e);
              }
            }
          });
        }
      } catch (err) {
        console.warn("Error loading dynamic footer settings:", err);
      }
    }

    loadFooterConfig();
  }, [supabase]);

  return (
    <footer className="relative bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Logo className="h-8 w-8" />
              <span className="font-display font-semibold text-lg text-slate-900 dark:text-white">
                {appName}
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-xs leading-relaxed">
              {footerDesc}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((s) => {
                const IconComponent = SOCIAL_ICON_MAP[s.iconName] || Twitter;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <IconComponent className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {systemStatus}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}