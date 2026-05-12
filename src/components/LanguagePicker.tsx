import { useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "../contexts/I18nContext";
import { LANGUAGES } from "../data/i18n/languages";
import type { Language } from "../data/i18n/languages";
import "./LanguagePicker.css";

const LANGUAGE_FLAGS: Record<Language, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
};

export default function LanguagePicker() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = useMemo(
    () =>
      (Object.keys(LANGUAGES) as Language[]).map((lang) => ({
        lang,
        label: LANGUAGES[lang],
        flag: LANGUAGE_FLAGS[lang],
      })),
    [],
  );

  const currentOption = options.find((option) => option.lang === language) ?? options[0];

  return (
    <div className="language-picker" ref={pickerRef}>
      <button
        type="button"
        className="language-picker-button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Language: ${currentOption.label}`}
      >
        <span className="language-picker-flag" aria-hidden="true">
          {currentOption.flag}
        </span>
        <span className="language-picker-label">{currentOption.label}</span>
        <span className="language-picker-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="language-picker-menu" role="menu" aria-label="Select language">
          {options.map((option) => (
            <button
              key={option.lang}
              type="button"
              className={`language-picker-item${language === option.lang ? " active" : ""}`}
              onClick={() => {
                setLanguage(option.lang);
                setIsOpen(false);
              }}
              role="menuitemradio"
              aria-checked={language === option.lang}
            >
              <span className="language-picker-flag" aria-hidden="true">
                {option.flag}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
