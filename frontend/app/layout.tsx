import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// ★ DYNAMIC METADATA GENERATION: Ingests SEO, app name, and social tags directly from database
export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = createClient();
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "app_name",
        "app_tagline",
        "app_description",
        "app_keywords",
        "app_url",
        "og_image_url",
        "twitter_handle",
      ]);

    const map = (settings || []).reduce(
      (acc: Record<string, string>, item: { key: string; value: string }) => {
        acc[item.key] = item.value;
        return acc;
      },
      {}
    );

    const appName = map.app_name || process.env.NEXT_PUBLIC_APP_NAME || "PitchGenius";
    const appTagline = map.app_tagline || "AI Presentation Generator";
    const appDescription =
      map.app_description ||
      "Create stunning presentations in seconds with AI. Turn prompts, documents, and notes into beautiful decks instantly.";
    const appUrl = map.app_url || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const keywords = map.app_keywords
      ? map.app_keywords.split(",").map((k) => k.trim())
      : [
          "AI presentation generator",
          "pitch deck",
          "slide maker",
          "AI slides",
          "presentation tool",
          "Gamma alternative",
        ];
    const ogImage = map.og_image_url || "/logo.png";
    const twitterHandle = map.twitter_handle || "@pitchgenius";

    return {
      metadataBase: new URL(appUrl),
      title: {
        default: `${appName} — ${appTagline}`,
        template: `%s | ${appName}`,
      },
      description: appDescription,
      keywords,
      authors: [{ name: appName }],
      creator: appName,
      icons: {
        icon: [
          { url: "/logo.png", type: "image/png" },
          { url: "/favicon.ico", sizes: "any" },
        ],
        apple: "/logo.png",
        shortcut: "/logo.png",
      },
      openGraph: {
        type: "website",
        locale: "en_US",
        url: "/",
        siteName: appName,
        title: `${appName} — ${appTagline}`,
        description: appDescription,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: appName,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${appName} — ${appTagline}`,
        description: appDescription,
        images: [ogImage],
        creator: twitterHandle,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } catch (error) {
    // Resilient fallback if DB is unreachable during build
    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      title: {
        default: "PitchGenius — AI Presentation Generator",
        template: "%s | PitchGenius",
      },
      description:
        "Create stunning presentations in seconds with AI. Turn prompts, documents, and notes into beautiful decks instantly.",
    };
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20">
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            theme="system"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: "var(--toast-bg)",
                color: "var(--toast-text)",
                border: "1px solid var(--toast-border)",
                fontSize: "13px",
                fontWeight: 500,
                padding: "12px 16px",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              },
              className: "font-sans",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}