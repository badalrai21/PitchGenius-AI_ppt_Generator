import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useAutoSave(
  presentationId: string | null,
  slides: any[],
  title: string
) {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [debounceMs, setDebounceMs] = useState<number>(1500);
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const failureCountRef = useRef(0);
  const supabase = createClient();

  // ★ DYNAMIC DEBOUNCE SETTING: Ingest auto-save debounce delay from database
  useEffect(() => {
    async function loadAutoSaveSettings() {
      try {
        const { data: settingData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "autosave_debounce_ms")
          .maybeSingle();

        if (settingData && settingData.value) {
          const parsed = parseInt(settingData.value, 10);
          if (!isNaN(parsed) && parsed >= 500) {
            setDebounceMs(parsed);
          }
        }
      } catch (err) {
        console.warn("Could not load autosave_debounce_ms setting:", err);
      }
    }

    loadAutoSaveSettings();
  }, [supabase]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!presentationId) return;

    setSaveStatus("unsaved");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const { error } = await supabase
          .from("presentations")
          .update({
            title,
            slides_data: slides,
            slide_count: slides.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", presentationId);

        if (error) throw error;

        setSaveStatus("saved");
        failureCountRef.current = 0;
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaveStatus("unsaved");
        failureCountRef.current += 1;

        // Alert user after 3 consecutive failures — likely connection issue
        if (failureCountRef.current === 3) {
          toast.error("Auto-save is failing. Please check your connection.", {
            duration: 5000,
          });
        }
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [slides, title, presentationId, debounceMs, supabase]);

  return saveStatus;
}