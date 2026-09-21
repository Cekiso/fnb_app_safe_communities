import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'zu', label: 'isiZulu', native: 'isiZulu' },
  { code: 'xh', label: 'isiXhosa', native: 'isiXhosa' },
  { code: 'af', label: 'Afrikaans', native: 'Afrikaans' },
  { code: 'st', label: 'Sesotho', native: 'Sesotho' },
];

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap justify-center'}`}>
      <Globe className="h-5 w-5 text-adult-navy/60" aria-hidden="true" />
      <span className="sr-only">{t('landing.language')}</span>
      <div className="flex flex-wrap gap-1.5">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-adult-teal/40 ${
              i18n.language === lang.code
                ? 'bg-adult-teal text-white shadow-sm'
                : 'bg-white text-adult-navy hover:bg-adult-sand border border-adult-sand-dark'
            }`}
            aria-pressed={i18n.language === lang.code}
            aria-label={lang.native}
          >
            {lang.native}
          </button>
        ))}
      </div>
    </div>
  );
}
