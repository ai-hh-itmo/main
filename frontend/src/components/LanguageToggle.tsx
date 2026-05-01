"use client";

import type { Dictionary, Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageToggleProps = {
  language: Language;
  labels: Dictionary["language"];
  onChange: (language: Language) => void;
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
            "h-7 rounded-full px-3 text-xs font-medium text-muted transition duration-200 hover:text-ink",
            language === item && "bg-[oklch(94%_0.01_260)] text-ink",
          )}
          key={item}
          onClick={() => onChange(item)}
          type="button"
        >
          {item === "ru" ? labels.russian : labels.english}
        </button>
      ))}
    </div>
  );
}
