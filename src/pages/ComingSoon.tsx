import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { QuickExit } from '@/components/QuickExit';

export function ComingSoon({ title, mode = 'adult' }: { title: string; mode?: 'adult' | 'youth' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isYouth = mode === 'youth';

  return (
    <div className={`min-h-screen ${isYouth ? 'bg-youth-cream' : 'bg-adult-sand'}`}>
      <QuickExit />
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
        <div
          className={`mb-5 inline-flex items-center justify-center rounded-full p-5 ${
            isYouth ? 'bg-youth-blue/10' : 'bg-adult-teal/10'
          }`}
        >
          <Construction
            className={`h-10 w-10 ${isYouth ? 'text-youth-blue' : 'text-adult-teal'}`}
            aria-hidden="true"
          />
        </div>
        <h1
          className={`font-heading text-2xl font-bold ${isYouth ? 'text-youth-navy' : 'text-adult-navy'}`}
        >
          {title}
        </h1>
        <p
          className={`mt-2 font-body text-sm ${isYouth ? 'text-youth-navy/60' : 'text-adult-navy/60'}`}
        >
          This feature is coming in a future phase.
        </p>
        <button
          onClick={() => navigate(isYouth ? '/youth' : '/adult')}
          className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 ${
            isYouth
              ? 'bg-youth-blue text-white hover:bg-blue-600 focus:ring-youth-blue/30'
              : 'bg-adult-teal text-white hover:bg-adult-teal-light focus:ring-adult-teal/30'
          }`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('common.back')}
        </button>
      </div>
    </div>
  );
}
