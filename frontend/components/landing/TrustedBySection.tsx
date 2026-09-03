"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_COMPANIES = [
  "TechCrunch",
  "Forbes",
  "Y Combinator",
  "Product Hunt",
  "Wired",
  "Bloomberg",
  "Fast Company",
  "The Verge",
  "Inc.",
  "Business Insider",
];

export function TrustedBySection() {
  const [companies, setCompanies] = useState<string[]>(DEFAULT_COMPANIES);
  const [title, setTitle] = useState<string>("Trusted by teams at world-class companies");

  const supabase = createClient();

  useEffect(() => {
    async function loadCompaniesFromDB() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", ["trusted_by_heading", "trusted_by_companies"]);

        if (settings && settings.length > 0) {
          settings.forEach((s) => {
            if (s.key === "trusted_by_heading" && s.value) {
              setTitle(s.value);
            }
            if (s.key === "trusted_by_companies" && s.value) {
              try {
                const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setCompanies(parsed);
                }
              } catch (e) {
                console.warn("Could not parse trusted_by_companies JSON:", e);
              }
            }
          });
        }
      } catch (err) {
        console.warn("Error loading dynamic trusted-by settings:", err);
      }
    }

    loadCompaniesFromDB();
  }, [supabase]);

  return (
    <section className="relative py-16 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
          {title}
        </p>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10" />

          <div className="flex marquee">
            {[...companies, ...companies].map((company, i) => (
              <div
                key={i}
                className="flex-shrink-0 mx-8 md:mx-12 text-2xl md:text-3xl font-display font-bold text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors whitespace-nowrap"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}