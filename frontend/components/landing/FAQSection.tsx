"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createClient } from "@/lib/supabase/client";

interface FAQItem {
  q: string;
  a: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    q: "How does the AI generate presentations?",
    a: "Our multi-model AI engine (Groq, Gemini, HuggingFace) analyzes your prompt and creates a structured presentation with diverse layouts, punchy copy, contextual images, and speaker notes — typically in under 30 seconds.",
  },
  {
    q: "Can I edit the generated slides?",
    a: "Absolutely! Every slide is fully editable in our drag-and-drop editor. Change text, swap layouts, add images, adjust colors, rearrange slides — everything is customizable.",
  },
  {
    q: "What file formats can I export?",
    a: "You can export to PowerPoint (.pptx), PDF, and share via public link. PNG per-slide export and video export are coming soon.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! Our Free plan lets you create 5 presentations per month with up to 10 slides each. No credit card required. Upgrade to Pro anytime for unlimited generations.",
  },
  {
    q: "Can I upload existing documents?",
    a: "Yes. Upload PDFs (up to 35 pages), Word documents, or plain text files. Our AI will extract the content and transform it into a beautifully designed presentation.",
  },
  {
    q: "Do you support team collaboration?",
    a: "Team plans include real-time collaboration, shared workspaces, admin controls, and SSO. Multiple people can edit the same presentation simultaneously.",
  },
  {
    q: "Can I use my own branding?",
    a: "Pro and Team plans support custom branding — upload your logo, set brand colors and fonts, and every generated presentation will automatically match your brand.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use enterprise-grade encryption, SOC 2-ready infrastructure, and never train AI models on your data. Your presentations are 100% private by default.",
  },
];

export function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>(DEFAULT_FAQS);
  const [supportEmail, setSupportEmail] = useState<string>("support@pitchgenius.com");
  const [faqHeader, setFaqHeader] = useState({
    badge: "FAQ",
    headingLine1: "Questions?",
    headingLine2: "We've got answers.",
    subheading: "Everything you need to know before getting started.",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadFaqConfig() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", [
            "landing_faqs",
            "support_email",
            "faq_badge",
            "faq_heading_line1",
            "faq_heading_line2",
            "faq_subheading",
          ]);

        if (settings && settings.length > 0) {
          const map: Record<string, string> = {};
          settings.forEach((s) => {
            map[s.key] = s.value;
          });

          if (map.support_email) setSupportEmail(map.support_email);

          setFaqHeader((prev) => ({
            badge: map.faq_badge || prev.badge,
            headingLine1: map.faq_heading_line1 || prev.headingLine1,
            headingLine2: map.faq_heading_line2 || prev.headingLine2,
            subheading: map.faq_subheading || prev.subheading,
          }));

          if (map.landing_faqs) {
            try {
              const parsed = typeof map.landing_faqs === "string" ? JSON.parse(map.landing_faqs) : map.landing_faqs;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setFaqs(parsed);
              }
            } catch (e) {
              console.warn("Could not parse landing_faqs JSON:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Error loading dynamic FAQs:", err);
      }
    }

    loadFaqConfig();
  }, [supabase]);

  return (
    <section id="faq" className="relative py-24 md:py-32 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
      <div className="relative max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="pill-badge mb-6">
            <span>{faqHeader.badge}</span>
          </div>
          <h2 className="hero-heading text-4xl md:text-6xl text-slate-900 dark:text-white mb-6">
            {faqHeader.headingLine1}
            <br />
            <span className="gradient-text">{faqHeader.headingLine2}</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-light">
            {faqHeader.subheading}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="apple-card px-6 border-none data-[state=open]:shadow-xl"
              >
                <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-white hover:no-underline py-5 text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-slate-600 dark:text-slate-400 mb-3">Still have questions?</p>
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-medium hover:underline"
          >
            Contact our team →
          </a>
        </motion.div>
      </div>
    </section>
  );
}