"use client";

import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { PanelLeft } from "lucide-react";
import { useState } from "react";

import { HealthBadge } from "@/components/HealthBadge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { RecommendationForm } from "@/components/RecommendationForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { Card, CardContent } from "@/components/ui/card";
import { createRecommendations } from "@/lib/api";
import { defaultLanguage, dictionaries, type Language } from "@/lib/i18n";
import type { ApiErrorResponse, RecommendationResponse } from "@/lib/types";
import type { RecommendationPayload } from "@/lib/schemas";

export function TalentmineApp() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return defaultLanguage;
    }

    const storedLanguage = window.localStorage.getItem("talentmine-language");
    return storedLanguage === "ru" || storedLanguage === "en" ? storedLanguage : defaultLanguage;
  });
  const t = dictionaries[language];
  const mutation = useMutation<
    RecommendationResponse,
    ApiErrorResponse,
    RecommendationPayload
  >({
    mutationFn: createRecommendations,
  });

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("talentmine-language", nextLanguage);
  }

  return (
    <main className="min-h-screen px-3 py-3 text-ink sm:px-5 sm:py-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[30px] border border-line bg-panel/58 backdrop-blur-2xl sm:min-h-[calc(100vh-2.5rem)]">
        <div className="flex h-14 items-center justify-between border-b border-line px-4 sm:px-5">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="grid size-7 place-items-center rounded-full border border-line bg-[oklch(97%_0.008_260)]">
              <PanelLeft className="size-3.5 text-muted" aria-hidden />
            </span>
            <span className="font-medium tracking-[-0.02em]">Talentmine</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="hidden text-muted sm:inline"
                exit={{ opacity: 0, y: -3 }}
                initial={{ opacity: 0, y: 3 }}
                key={language}
                transition={{ duration: 0.16 }}
              >
                {t.app.console}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle
              labels={t.language}
              language={language}
              onChange={handleLanguageChange}
            />
            <HealthBadge t={t} />
          </div>
        </div>

        <section className="grid flex-1 gap-px bg-line lg:grid-cols-[minmax(22rem,0.86fr)_minmax(0,1.14fr)]">
          <motion.aside
            animate={{ opacity: 1, y: 0 }}
            className="bg-canvas/58 p-3 sm:p-5"
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="h-full rounded-[24px] bg-panel/82">
              <CardContent className="p-4 sm:p-5">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  initial={{ opacity: 0, y: 4 }}
                  key={language}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <RecommendationForm
                    isPending={mutation.isPending}
                    t={t}
                    onSubmit={(values) => mutation.mutate(values)}
                  />
                </motion.div>
              </CardContent>
            </Card>
          </motion.aside>

          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="bg-canvas/58 p-3 sm:p-5"
            initial={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: 4 }}
              key={language}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <ResultsPanel
                data={mutation.data}
                error={mutation.error ?? null}
                isPending={mutation.isPending}
                t={t}
              />
            </motion.div>
          </motion.section>
        </section>
      </div>
    </main>
  );
}
