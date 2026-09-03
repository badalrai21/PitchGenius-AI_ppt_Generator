import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Slide, ThemeConfig } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";

// Apple Studio — Signature clean light theme default fallback
export const DEFAULT_THEME: ThemeConfig = {
  primary: "#0077B6",
  secondary: "#00B4D8",
  accent: "#86868B",
  bg: "#FFFFFF",
  text: "#1D1D1F",
  muted: "#86868B",
  headingFont: "Space Grotesk",
  bodyFont: "Inter",
  gradient: "linear-gradient(135deg, #0077B6 0%, #00B4D8 60%, #90E0EF 100%)",
};

export const SAMPLE_SLIDES: Slide[] = [
  {
    id: "sample-1",
    index: 1,
    layout: "title",
    title: "The Future of Visual Content",
    subtitle: "AI-Powered Documentation & Presentations",
    body: "Transform ideas into polished visual decks in seconds.",
    icon: "Sparkles",
    speaker_notes: "Welcome everyone. Today we explore Apple-grade AI generation.",
  },
  {
    id: "sample-2",
    index: 2,
    layout: "bullets",
    title: "Core Strategic Advantages",
    subtitle: "Why modern teams prefer AI presentations",
    bullets: [
      "10x faster generation from simple prompts or documents",
      "Pixel-perfect responsive layouts on any screen size",
      "Built-in AI image generation and stock photography",
      "Instant PDF & PPTX exports with custom brand kit",
    ],
    icon: "Layers",
    speaker_notes: "Focus on speed, consistency, and visual impact.",
  },
  {
    id: "sample-3",
    index: 3,
    layout: "two_column",
    title: "Legacy Tools vs. PitchGenius",
    left_column: {
      title: "Traditional PPT",
      points: [
        "Hours wasted on formatting",
        "Inconsistent slide styles",
        "Static, non-interactive files",
      ],
    },
    right_column: {
      title: "PitchGenius AI",
      points: [
        "30-second AI generation",
        "Automated designer themes",
        "Interactive web & export deck",
      ],
    },
    icon: "Scale",
    speaker_notes: "Compare traditional manual work against automated AI flow.",
  },
  {
    id: "sample-4",
    index: 4,
    layout: "metrics",
    title: "Impact & Growth Metrics",
    subtitle: "Proven outcomes across 10,000+ creators",
    metrics: [
      { value: "10x", label: "Faster Deck Creation" },
      { value: "85%", label: "Time Savings" },
      { value: "4.9/5", label: "User Rating" },
    ],
    icon: "TrendingUp",
    speaker_notes: "Review these top-line adoption metrics with stakeholders.",
  },
  {
    id: "sample-5",
    index: 5,
    layout: "quote",
    title: "Customer Voice",
    quote: "PitchGenius transformed how our team ships investor decks. What took days now takes minutes.",
    quote_author: "Sarah Chen, VP Product at Notion",
    icon: "Quote",
    speaker_notes: "End with an authentic customer testimonial for emotional impact.",
  },
];

interface PresentationState {
  id: string | null;
  title: string;
  slides: Slide[];
  activeSlideIndex: number;
  theme: ThemeConfig;
  themeSlug: string;
  artStyle: string;
  isHydrated: boolean;

  setPresentation: (data: {
    id?: string;
    title: string;
    slides: Slide[];
    theme?: ThemeConfig;
    themeSlug?: string;
    artStyle?: string;
  }) => void;
  setHydrated: () => void;
  setTitle: (title: string) => void;
  setActiveSlideIndex: (index: number) => void;
  setTheme: (theme: ThemeConfig, slug?: string) => void;
  setArtStyle: (artStyle: string) => void;

  updateSlide: (index: number, updatedFields: Partial<Slide>) => void;
  addSlide: (afterIndex?: number, layout?: string) => void;
  duplicateSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  reorderSlides: (startIndex: number, endIndex: number) => void;

  // ★ Dynamic database syncing action
  loadDefaultTemplateFromDB: () => Promise<void>;
}

export const usePresentationStore = create<PresentationState>()(
  persist(
    (set, get) => ({
      id: null,
      title: "Untitled Presentation",
      slides: [],
      activeSlideIndex: 0,
      theme: DEFAULT_THEME,
      themeSlug: "apple-studio",
      artStyle: "modern",
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      setPresentation: (data) => {
        set({
          id: data.id || null,
          title: data.title || "Untitled Presentation",
          slides: data.slides && data.slides.length > 0 ? data.slides : SAMPLE_SLIDES,
          theme: data.theme || DEFAULT_THEME,
          themeSlug: data.themeSlug || "apple-studio",
          artStyle: data.artStyle || "modern",
          activeSlideIndex: 0,
        });
      },

      setTitle: (title) => set({ title }),
      setActiveSlideIndex: (activeSlideIndex) => set({ activeSlideIndex }),
      setTheme: (theme, slug) =>
        set((state) => ({
          theme,
          themeSlug: slug || state.themeSlug,
        })),
      setArtStyle: (artStyle) => set({ artStyle }),

      updateSlide: (index, updatedFields) => {
        const { slides } = get();
        if (!slides[index]) return;
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], ...updatedFields };
        set({ slides: newSlides });
      },

      addSlide: (afterIndex, layout = "bullets") => {
        const { slides, activeSlideIndex } = get();
        const targetIndex = afterIndex !== undefined ? afterIndex + 1 : activeSlideIndex + 1;

        const newSlide: Slide = {
          id: `slide-${Date.now()}`,
          index: targetIndex + 1,
          layout,
          title: "New Slide Headline",
          subtitle: "Add a concise description",
          bullets: [
            "First key takeaway point",
            "Second supporting argument",
            "Actionable conclusion",
          ],
          icon: "Sparkles",
          speaker_notes: "Speaker notes for this slide...",
        };

        const newSlides = [...slides];
        newSlides.splice(targetIndex, 0, newSlide);
        const reindexed = newSlides.map((s, idx) => ({ ...s, index: idx + 1 }));

        set({
          slides: reindexed,
          activeSlideIndex: targetIndex,
        });
      },

      duplicateSlide: (index) => {
        const { slides } = get();
        const slideToCopy = slides[index];
        if (!slideToCopy) return;

        const duplicated: Slide = {
          ...slideToCopy,
          id: `slide-${Date.now()}`,
          title: `${slideToCopy.title} (Copy)`,
        };

        const newSlides = [...slides];
        newSlides.splice(index + 1, 0, duplicated);
        const reindexed = newSlides.map((s, idx) => ({ ...s, index: idx + 1 }));

        set({
          slides: reindexed,
          activeSlideIndex: index + 1,
        });
      },

      deleteSlide: (index) => {
        const { slides, activeSlideIndex } = get();
        if (slides.length <= 1) return;

        const newSlides = slides.filter((_, i) => i !== index);
        const reindexed = newSlides.map((s, idx) => ({ ...s, index: idx + 1 }));
        const newActiveIndex = Math.min(activeSlideIndex, reindexed.length - 1);

        set({
          slides: reindexed,
          activeSlideIndex: newActiveIndex,
        });
      },

      reorderSlides: (startIndex, endIndex) => {
        const { slides } = get();
        const result = Array.from(slides);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        const reindexed = result.map((s, idx) => ({ ...s, index: idx + 1 }));
        set({
          slides: reindexed,
          activeSlideIndex: endIndex,
        });
      },

      // ★ DYNAMIC TEMPLATE SYNC: Ingest default template directly from the database
      loadDefaultTemplateFromDB: async () => {
        try {
          const supabase = createClient();
          const { data: defaultTemplate } = await supabase
            .from("templates")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (defaultTemplate) {
            const rawTheme = defaultTemplate.theme_config || defaultTemplate.colors || DEFAULT_THEME;
            const slidesData = defaultTemplate.slides_layout || SAMPLE_SLIDES;

            set((state) => ({
              theme: rawTheme,
              themeSlug: defaultTemplate.slug || state.themeSlug,
              slides: state.slides.length === 0 ? slidesData : state.slides,
            }));
          }
        } catch (err) {
          console.warn("Using default store theme:", err);
        }
      },
    }),
    {
      name: "pitchgenius-presentation-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);