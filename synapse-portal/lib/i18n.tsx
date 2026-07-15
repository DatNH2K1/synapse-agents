"use client";

import React, { createContext, useContext, useState } from "react";
import en from "../locales/en.json";
import vi from "../locales/vi.json";

type Translations = typeof en;
export type Language = "en" | "vi" | "ja" | "zh";

const translations: Record<Language, Translations> = { en, vi, ja: en, zh: en };

const I18nContext = createContext<{
  t: (
    key: keyof Translations,
    params?: Record<string, string | number>,
  ) => string;
  locale: Language;
  setLocale: (l: Language) => void;
} | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Language>("en");

  const t = (
    key: keyof Translations,
    params?: Record<string, string | number>,
  ) => {
    let text = translations[locale][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
