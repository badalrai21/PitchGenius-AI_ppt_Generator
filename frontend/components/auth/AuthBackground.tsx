"use client";

import { useEffect, useState } from "react";

export function AuthBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Clean white base */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fafcff 100%)",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: "linear-gradient(180deg, #030712 0%, #0a0f1e 100%)",
        }}
      />

      {/* Subtle ambient orb */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(0,180,216,0.3) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] rounded-full opacity-15 dark:opacity-8"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 65%)",
          filter: "blur(90px)",
        }}
      />
    </div>
  );
}