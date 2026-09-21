import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, HeartHandshake, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { QuickExit } from '@/components/QuickExit';
import { LanguageSelector } from '@/components/LanguageSelector';

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setMode } = useApp();

  const enterMode = (mode: 'adult' | 'youth') => {
    setMode(mode);
    navigate(`/${mode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-adult-sand via-white to-adult-sand">
      <QuickExit />

      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-adult-teal/10 p-4">
            <Shield className="h-10 w-10 text-adult-teal" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-adult-navy sm:text-4xl">
            {t('app.name')}
          </h1>
          <p className="mt-2 font-body text-lg text-adult-navy/70">
            {t('app.tagline')}
          </p>
        </div>

        {/* Language selector */}
        <div className="mb-8 animate-slide-up">
          <LanguageSelector />
        </div>

        {/* Mode cards */}
        <div className="grid w-full gap-5 sm:grid-cols-2">
          {/* Adult Mode */}
          <button
            onClick={() => enterMode('adult')}
            className="group flex flex-col items-start rounded-3xl bg-white p-7 text-left shadow-lg ring-1 ring-adult-sand-dark transition-all hover:shadow-xl hover:ring-adult-teal/30 focus:outline-none focus:ring-2 focus:ring-adult-teal/50 animate-slide-up"
          >
            <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-adult-teal/10 p-3.5">
              <Shield className="h-8 w-8 text-adult-teal" aria-hidden="true" />
            </div>
            <h2 className="font-heading text-xl font-bold text-adult-navy">
              {t('landing.adultMode')}
            </h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-adult-navy/70">
              {t('landing.adultModeDesc')}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-adult-teal transition-transform group-hover:translate-x-0.5">
              {t('landing.enterAdult')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>

          {/* Young Person Mode */}
          <button
            onClick={() => enterMode('youth')}
            className="group flex flex-col items-start rounded-3xl bg-youth-cream p-7 text-left shadow-lg ring-1 ring-youth-lavender/20 transition-all hover:shadow-xl hover:ring-youth-blue/30 focus:outline-none focus:ring-2 focus:ring-youth-blue/50 animate-slide-up"
          >
            <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-youth-blue/15 p-3.5">
              <HeartHandshake className="h-8 w-8 text-youth-blue" aria-hidden="true" />
            </div>
            <h2 className="font-heading text-xl font-bold text-youth-navy">
              {t('landing.youthMode')}
            </h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-youth-navy/70">
              {t('landing.youthModeDesc')}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-youth-blue transition-transform group-hover:translate-x-0.5">
              {t('landing.enterYouth')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-10 max-w-md text-center font-body text-xs leading-relaxed text-adult-navy/50">
          {t('landing.subtitle')}
        </p>
      </div>
    </div>
  );
}
