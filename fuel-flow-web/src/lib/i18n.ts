import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import ur from "@/locales/ur.json";

export const SUPPORTED_LANGUAGES = ["en", "ur"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "fuel-flow-language";

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(stored ?? "")
    ? (stored as SupportedLanguage)
    : "en";
}

function dirFor(lng: string): "ltr" | "rtl" {
  return lng === "ur" ? "rtl" : "ltr";
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

if (typeof document !== "undefined") {
  document.documentElement.dir = dirFor(i18n.language);
  document.documentElement.lang = i18n.language;
}

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  }
  if (typeof document !== "undefined") {
    document.documentElement.dir = dirFor(lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
