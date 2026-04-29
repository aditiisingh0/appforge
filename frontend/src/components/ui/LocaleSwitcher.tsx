'use client';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { SUPPORTED_LOCALES } from '@/lib/i18n';

export function LocaleSwitcher() {
  const { i18n } = useTranslation();

  const changeLocale = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('af_locale', code);
  };

  const current = SUPPORTED_LOCALES.find(l => l.code === i18n.language) || SUPPORTED_LOCALES[0];

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full">
        <Globe className="w-4 h-4" />
        <span>{current.flag} {current.label}</span>
      </button>
      <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 hidden group-hover:block min-w-full z-10">
        {SUPPORTED_LOCALES.map(locale => (
          <button
            key={locale.code}
            onClick={() => changeLocale(locale.code)}
            className={`flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-gray-50 ${
              i18n.language === locale.code ? 'text-indigo-600 font-medium' : 'text-gray-700'
            }`}
          >
            {locale.flag} {locale.label}
          </button>
        ))}
      </div>
    </div>
  );
}
