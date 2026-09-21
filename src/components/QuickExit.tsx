import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NEUTRAL_URL = 'https://www.google.com/search?q=weather';

export function QuickExit() {
  const { t } = useTranslation();
  const lastEscapeRef = useRef<number>(0);

  const exit = useCallback(() => {
    try {
      supabase.auth.signOut();
    } catch {
      // non-critical
    }
    try {
      sessionStorage.clear();
    } catch {
      // non-critical
    }
    window.history.replaceState(null, '', NEUTRAL_URL);
    window.location.href = NEUTRAL_URL;
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscapeRef.current < 600) {
          exit();
        }
        lastEscapeRef.current = now;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [exit]);

  return (
    <button
      onClick={exit}
      className="fixed top-3 right-3 z-50 flex items-center gap-1.5 rounded-full bg-adult-navy/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-adult-navy hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95"
      aria-label={t('quickExit.label')}
      title={t('landing.quickExitHint')}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>{t('quickExit.label')}</span>
    </button>
  );
}
