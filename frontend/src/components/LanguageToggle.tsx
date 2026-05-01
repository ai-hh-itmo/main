"use client";

import { motion } from "motion/react";

import type { Dictionary, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageToggleProps = {
  language: Language;
  labels: Dictionary["language"];
  onChange: (language: Language) => void;
};

const flags: Record<Language, string> = {
  en: "🇬🇧",
  ru: "🇷🇺",
};

export function LanguageToggle({ language, labels, onChange }: LanguageToggleProps) {
  return (
    <div
      aria-label={labels.label}
      className="inline-flex rounded-full border border-line bg-panel/70 p-0.5"
      role="group"
    >
      {(["ru", "en"] as const).map((item) => (
        <button
          className={cn(
            "relative h-7 rounded-full px-3 text-xs font-medium text-muted transition-colors duration-300 hover:text-ink",
            language === item && "text-ink",
          )}
          key={item}
          onClick={() => onChange(item)}
          type="button"
        >
          {language === item ? (
            <motion.span
              className="absolute inset-0 rounded-full bg-[oklch(94%_0.01_260)]"
              layoutId="language-toggle-active"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null}
          <span className="relative z-10 flex items-center gap-1.5">
            <span aria-hidden className="text-[13px] leading-none">
              {flags[item]}
            </span>
            <span>{item === "ru" ? labels.russian : labels.english}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
