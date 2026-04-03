import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { es } from '../i18n/es';
import { en } from '../i18n/en';

export type Lang = 'es' | 'en';

const dictionaries: Record<Lang, Record<string, string>> = { es, en };

interface I18nCtx {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nCtx>({
  lang: 'es',
  toggleLang: () => {},
  t: (key) => key,
});

const APP_LANG_KEY = 'roadix-lang';
const LANDING_LANG_KEY = 'ROADIX-landing-lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const appSaved = localStorage.getItem(APP_LANG_KEY);
    const landingSaved = localStorage.getItem(LANDING_LANG_KEY);
    const saved = appSaved || landingSaved;
    return saved === 'en' ? 'en' : 'es';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () =>
    setLang((prev) => {
      const next = prev === 'es' ? 'en' : 'es';
      localStorage.setItem(APP_LANG_KEY, next);
      localStorage.setItem(LANDING_LANG_KEY, next);
      return next;
    });

  const t = useCallback(
    (key: string, replacements?: Record<string, string | number>) => {
      let value = dictionaries[lang][key] ?? key;
      if (replacements) {
        Object.entries(replacements).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
