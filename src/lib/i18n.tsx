"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import enMessages from "@/messages/en.json";
import bnMessages from "@/messages/bn.json";

export type Locale = "en" | "bn";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (keyPath: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "bn",
  setLocale: () => {},
  t: (keyPath: string) => keyPath,
});

const translations: Record<Locale, any> = {
  en: enMessages,
  bn: bnMessages,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("bn");

  useEffect(() => {
    const saved = localStorage.getItem("nirapod_locale") as Locale;
    if (saved === "en" || saved === "bn") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("nirapod_locale", newLocale);
  };

  const t = (keyPath: string, fallback?: string): string => {
    const parts = keyPath.split(".");
    let current: any = translations[locale];

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        // Fallback to English
        let enCurrent: any = translations.en;
        for (const enPart of parts) {
          if (enCurrent && typeof enCurrent === "object" && enPart in enCurrent) {
            enCurrent = enCurrent[enPart];
          } else {
            return fallback || keyPath;
          }
        }
        return typeof enCurrent === "string" ? enCurrent : fallback || keyPath;
      }
    }

    return typeof current === "string" ? current : fallback || keyPath;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
