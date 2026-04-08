'use client';

import { createContext, useContext, useState, useEffect, createElement, type ReactNode } from 'react';
import { translations, RTL_LANGS, type Lang, type Translations } from './i18n';

type LangContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
};

const LanguageContext = createContext<LangContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const routerLocale = 'en'
  const initial: Lang = routerLocale in translations ? routerLocale : 'en';
  const [lang, setLangState] = useState<Lang>(initial);

  useEffect(() => {
    const newLang = 'en'//(router.locale ?? 'en') as Lang;
    const valid: Lang = newLang in translations ? newLang : 'en';
    setLangState(valid);
    document.documentElement.dir = RTL_LANGS.includes(valid) ? 'rtl' : 'ltr';
    document.documentElement.lang = valid;
  }, [routerLocale]);

  function setLang(l: Lang) {
    // router.push(router.pathname, router.asPath, { locale: l });
  }

  return createElement(
    LanguageContext.Provider,
    { value: { lang, setLang, t: translations[lang] } },
    children,
  );
}

export function useLanguage(): LangContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
