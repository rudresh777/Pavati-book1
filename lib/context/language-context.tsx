'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import mrDict from '../i18n/mr.json';
import enDict from '../i18n/en.json';

export type SupportedLanguage = 'mr' | 'en';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof mrDict>;

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const dictionaries: Record<SupportedLanguage, any> = {
  mr: mrDict,
  en: enDict,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('mr');

  useEffect(() => {
    // Read from localStorage or cookie
    const saved = localStorage.getItem('mandal_app_lang') as SupportedLanguage | null;
    if (saved === 'mr' || saved === 'en') {
      setLanguageState(saved);
      document.cookie = `mandal_app_lang=${saved}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('mandal_app_lang', lang);
    document.cookie = `mandal_app_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const t = (key: string, fallback?: string): string => {
    const dict = dictionaries[language] || dictionaries.mr;
    const keys = key.split('.');
    let current: any = dict;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to mrDict
        let fb: any = dictionaries.mr;
        for (const fbk of keys) {
          if (fb && typeof fb === 'object' && fbk in fb) {
            fb = fb[fbk];
          } else {
            fb = undefined;
            break;
          }
        }
        return fb !== undefined ? String(fb) : fallback || key;
      }
    }

    return typeof current === 'string' ? current : fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
