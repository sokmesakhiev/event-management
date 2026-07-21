import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/locales/en.json";
import km from "@/i18n/locales/km.json";

export const SUPPORTED_LANGUAGES = ["en", "km"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "rally_lang";

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function syncHtmlLang(lang: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
}

// Always boot in English, on both the server and the client's first render.
// SSR has no access to localStorage, so if we read a stored preference here
// the server would render English while the client's first render could
// render Khmer — a hydration mismatch. A stored preference is applied after
// mount instead (see applyStoredLanguage), the same "sync after load"
// pattern this app already uses for things like syncing branding state from
// a query result.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      km: { translation: km },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: false },
  });
}

/** Call once, from a client-only effect after mount — never at module scope
 * or during SSR. Applies a previously saved language preference, if any. */
export function applyStoredLanguage() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(stored) && stored !== i18n.language) {
    i18n.changeLanguage(stored);
  }
  syncHtmlLang(i18n.language);
}

/** User picked a language from the switcher — persist it and apply it. */
export function setLanguage(lang: SupportedLanguage) {
  i18n.changeLanguage(lang);
  syncHtmlLang(lang);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }
}

export default i18n;
