"use client";

import Image from "next/image";
import { useState } from "react";
import { config } from "@/lib/config";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  // Fallback SVG if custom logo isn't uploaded yet
  if (imgError || !config.app.logoUrl) {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="40" height="40" rx="10" fill="url(#logo-gradient)" />
        <path
          d="M12 28V12h6.5c3.6 0 5.5 1.8 5.5 4.5S22.1 21 18.5 21H16v7h-4z"
          fill="white"
          fillOpacity="0.95"
        />
        <circle cx="28" cy="12" r="2.5" fill="white" fillOpacity="0.9" />
        <circle cx="31" cy="16" r="1.2" fill="white" fillOpacity="0.6" />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="#0077B6" />
            <stop offset="50%" stopColor="#00B4D8" />
            <stop offset="100%" stopColor="#90E0EF" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <div className={`relative shrink-0 ${className}`}>
      <Image
        src={config.app.logoUrl}
        alt={`${config.app.name} Logo`}
        fill
        className="object-contain"
        priority
        onError={() => setImgError(true)}
      />
    </div>
  );
}