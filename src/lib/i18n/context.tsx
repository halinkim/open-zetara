'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en, Locale } from './locales/en';

type Language = 'en' | 'ko';

interface I18nContextType {
    t: Locale;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const [t, setT] = useState<Locale>(en);

    // Load language from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('zetara-lang') as Language;
        if (saved) {
            setLanguage(saved);
        }
    }, []);

    // Update translations when language changes
    useEffect(() => {
        localStorage.setItem('zetara-lang', language);
        // In the future, dynamic import locales here
        if (language === 'en') {
            setT(en);
        } else {
            // Fallback to en for now or load other locales
            setT(en);
        }
    }, [language]);

    return (
        <I18nContext.Provider value={{ t, language, setLanguage }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
