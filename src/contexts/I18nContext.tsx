import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Language } from "../data/i18n/languages";
import { de } from "../data/i18n/de";
import { en } from "../data/i18n/en";
import useLocalStorage from "../hooks/useLocalStorage";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  de,
  en,
};

export function I18nProvider({
  children,
  initialLanguage = "de",
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguage] = useStoredLanguage(initialLanguage);

  const t = (key: string): string => {
    return translations[language][key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
  );
}

function useStoredLanguage(initial: Language): [Language, (lang: Language) => void] {
  const [language, setLanguageState] = useLocalStorage<Language>("i18n-language", initial);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return [language, setLanguage];
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
