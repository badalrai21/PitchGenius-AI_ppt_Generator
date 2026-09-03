"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

interface AppShellProps {
  profile?: any;
  userEmail?: string;
  children: React.ReactNode;
}

export function AppShell({ profile, userEmail, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("pitchgenius-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);

    const handleCollapseEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCollapsed(customEvent.detail);
    };

    window.addEventListener("sidebar-collapse-toggle", handleCollapseEvent);
    return () => {
      window.removeEventListener("sidebar-collapse-toggle", handleCollapseEvent);
    };
  }, []);

  const sidebarWidth = collapsed ? "72px" : "260px";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans">
      <AppSidebar profile={profile} userEmail={userEmail} />
      <main
        style={{
          marginLeft: mounted ? sidebarWidth : "260px",
          transition: "margin-left 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}