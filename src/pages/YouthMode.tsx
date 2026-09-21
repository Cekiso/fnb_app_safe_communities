import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LifeBuoy,
  ShieldX,
  Users,
  GraduationCap,
  Home,
  Smile,
} from 'lucide-react';
import { QuickExit } from '@/components/QuickExit';

const FEELINGS = ['😀', '😐', '😟', '😢', '😨'];

export function YouthMode() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mascotName = t('youth.mascotName');

  const buttons = [
    {
      icon: LifeBuoy,
      label: t('youth.needHelp'),
      color: 'bg-youth-coral text-white',
      ring: 'ring-youth-coral/20',
      route: '/youth/help',
    },
    {
      icon: ShieldX,
      label: t('youth.dontFeelSafe'),
      color: 'bg-youth-lavender text-white',
      ring: 'ring-youth-lavender/20',
      route: '/youth/unsafe',
    },
    {
      icon: Users,
      label: t('youth.safePeople'),
      color: 'bg-youth-blue text-white',
      ring: 'ring-youth-blue/20',
      route: '/youth/safe-people',
    },
    {
      icon: GraduationCap,
      label: t('youth.learnPlay'),
      color: 'bg-youth-yellow text-youth-navy',
      ring: 'ring-youth-yellow/20',
      route: '/youth/learn',
    },
  ];

  return (
    <div className="min-h-screen bg-youth-cream">
      <QuickExit />

      {/* Header with home button */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="rounded-full p-2 text-youth-navy transition-colors hover:bg-youth-cream focus:outline-none focus:ring-2 focus:ring-youth-blue/30"
              aria-label={t('common.home')}
            >
              <Home className="h-6 w-6" aria-hidden="true" />
            </button>
            <span className="font-heading text-sm font-bold text-youth-navy/60">
              {t('youth.quickExit')}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Mascot greeting */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="mb-3 inline-flex items-center justify-center rounded-full bg-youth-blue/10 p-5 animate-breathe">
            <span className="text-5xl" role="img" aria-label="owl mascot">
              🦉
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-youth-navy">
            {t('youth.welcome', { mascot: mascotName })}
          </h1>
        </div>

        {/* Feeling check-in */}
        <div className="mb-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-youth-lavender/10">
          <p className="mb-3 text-center font-heading text-base font-semibold text-youth-navy">
            {t('youth.feelingCheck')}
          </p>
          <div className="flex justify-center gap-3">
            {FEELINGS.map((emoji, i) => (
              <button
                key={i}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-youth-cream text-3xl transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-youth-blue/30"
                aria-label={`Feeling ${i + 1} of 5`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Four giant buttons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {buttons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.route}
                onClick={() => navigate(btn.route)}
                className={`flex min-h-[88px] items-center gap-4 rounded-3xl ${btn.color} p-6 shadow-lg ring-1 ${btn.ring} transition-all hover:shadow-xl active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-youth-blue/40 animate-slide-up`}
              >
                <Icon className="h-10 w-10 flex-shrink-0" aria-hidden="true" />
                <span className="font-heading text-xl font-bold text-left">
                  {btn.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Talk to a real person - always visible */}
        <div className="mt-6">
          <a
            href="tel:116"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-youth-mint/20 px-6 py-4 font-heading font-bold text-youth-navy shadow-sm ring-1 ring-youth-mint/30 transition-all hover:bg-youth-mint/30 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-youth-mint/40"
          >
            <Smile className="h-5 w-5" aria-hidden="true" />
            Childline 116 — {t('emergency.free')}
          </a>
        </div>
      </div>
    </div>
  );
}
