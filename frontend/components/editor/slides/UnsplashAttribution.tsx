"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UnsplashAttributionProps {
  imageUrl?: string;
}

export function UnsplashAttribution({ imageUrl }: UnsplashAttributionProps) {
  const [utmSource, setUtmSource] = useState<string>("pitchgenius");
  const supabase = createClient();

  useEffect(() => {
    async function loadUtmSource() {
      try {
        const { data: settingData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "utm_source")
          .maybeSingle();

        if (settingData && settingData.value) {
          setUtmSource(settingData.value);
        }
      } catch (err) {
        console.warn("Failed to load utm_source in UnsplashAttribution:", err);
      }
    }

    loadUtmSource();
  }, [supabase]);

  // Only show for Unsplash images
  if (!imageUrl || !imageUrl.includes("images.unsplash.com")) {
    return null;
  }

  return (
    <div className="absolute bottom-2 right-3 z-20 text-[8px] font-medium opacity-60 hover:opacity-100 transition-opacity">
      <a
        href={`https://unsplash.com?utm_source=${utmSource}&utm_medium=referral`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
        style={{ color: "inherit" }}
      >
        Photo on Unsplash
      </a>
    </div>
  );
}