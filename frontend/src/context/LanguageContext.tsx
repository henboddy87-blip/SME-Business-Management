import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('pos_language') as Language) || 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (language === 'kh') {
      root.setAttribute('lang', 'km');
      root.classList.add('font-khmer');
    } else {
      root.setAttribute('lang', 'en');
      root.classList.remove('font-khmer');
    }
    localStorage.setItem('pos_language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'en' ? 'kh' : 'en'));
  };

  const t = (key: string): string => {
    const dict = (translations[language] || translations['en']) as Record<string, string>;
    const enDict = translations['en'] as Record<string, string>;
    const shortKey = key.includes('.') ? key.split('.').pop()! : key;
    return dict[key] || dict[shortKey] || enDict[key] || enDict[shortKey] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
