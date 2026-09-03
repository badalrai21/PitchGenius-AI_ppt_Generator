import { createClient } from "@/lib/supabase/client";

// Base runtime configuration initialized from environment variables
export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "PitchGenius",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
    logoUrl: "/logo.png",
    tagline: "Create Stunning Presentations in Seconds",
    supportEmail: "support@pitchgenius.com",
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  },
  posthog: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY || "",
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
  },
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  },
  limits: {
    maxUploadSizeMB: parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || "15", 10),
    maxPdfPages: parseInt(process.env.NEXT_PUBLIC_MAX_PDF_PAGES || "35", 10),
    freeMonthlyPresentations: 5,
    freeMaxSlidesPerDeck: 10,
    proMaxSlidesPerDeck: 30,
    teamMaxSlidesPerDeck: 50,
  },
  social: {
    twitter: "https://twitter.com/pitchgenius",
    github: "https://github.com/pitchgenius",
    linkedin: "https://linkedin.com/company/pitchgenius",
  },
};

// ★ DYNAMIC SETTINGS RESOLVER: Ingest live overrides directly from Supabase `settings` table
export async function getDynamicAppConfig() {
  try {
    const supabase = createClient();
    const { data: settings, error } = await supabase
      .from("settings")
      .select("key, value");

    if (error || !settings) return config;

    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    return {
      ...config,
      app: {
        ...config.app,
        name: map.app_name || config.app.name,
        url: map.app_url || config.app.url,
        backendUrl: map.backend_url || config.app.backendUrl,
        tagline: map.app_tagline || config.app.tagline,
        supportEmail: map.support_email || config.app.supportEmail,
      },
      limits: {
        ...config.limits,
        maxUploadSizeMB: map.max_upload_size_mb
          ? parseInt(map.max_upload_size_mb, 10)
          : config.limits.maxUploadSizeMB,
        maxPdfPages: map.max_pdf_pages
          ? parseInt(map.max_pdf_pages, 10)
          : config.limits.maxPdfPages,
      },
      social: {
        twitter: map.social_twitter || config.social.twitter,
        github: map.social_github || config.social.github,
        linkedin: map.social_linkedin || config.social.linkedin,
      },
    };
  } catch (err) {
    console.warn("Using base environment config:", err);
    return config;
  }
}