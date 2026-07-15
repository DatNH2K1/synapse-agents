"use client";

import React, { useState, useRef, useEffect } from "react";
import { useI18n, type Language } from "@/lib/i18n";

import { Globe, ChevronUp, Check } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "vi", label: "Tiếng Việt", short: "VI" },
  { code: "ja", label: "日本語", short: "JA" },
  { code: "zh", label: "中文", short: "ZH" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-dashboard-bg/70 border border-white/10 rounded-xl hover:bg-dashboard-bg/85 hover:border-accent-primary/20 transition-all duration-300 group"
      >
        <div className="flex items-center gap-2">
          <Globe size={10} className="text-dashboard-fg/55" />
          <span className="text-[9px] font-black uppercase tracking-widest text-dashboard-fg/55 w-20 text-left">
            {t("language")}
          </span>
          <span className="text-[10px] font-black text-accent-primary group-hover:text-accent-primary transition-colors">
            {currentLang.short}
          </span>
          <span className="text-[10px] font-bold text-dashboard-fg/75 group-hover:text-dashboard-fg transition-colors">
            {currentLang.label}
          </span>
        </div>
        <ChevronUp
          size={12}
          className={`text-dashboard-fg/45 transition-transform duration-300 ${isOpen ? "rotate-0" : "rotate-180"}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-xl border border-white/10 bg-dashboard-bg/90 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLocale(lang.code as Language);

                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                locale === lang.code
                  ? "bg-accent-primary/10 text-dashboard-fg"
                  : "text-dashboard-fg/60 hover:bg-dashboard-fg/5 hover:text-dashboard-fg"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-black ${locale === lang.code ? "text-accent-primary" : "text-dashboard-fg/45"}`}
                >
                  {lang.short}
                </span>
                <span className="text-[11px] font-bold">{lang.label}</span>
              </div>
              {locale === lang.code && (
                <Check size={12} className="text-accent-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
