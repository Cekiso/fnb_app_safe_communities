import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Phone,
  MapPin,
  Share2,
  BookOpen,
  Users,
  UserCircle,
  Home,
  AlertTriangle,
  FileText,
  Search,
} from 'lucide-react';
import { QuickExit } from '@/components/QuickExit';
import { LanguageSelector } from '@/components/LanguageSelector';

export function AdultMode() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Phone, label: t('adult.emergency'), color: 'text-danger', route: '/adult/emergency' },
    { icon: MapPin, label: t('adult.services'), color: 'text-adult-teal', route: '/adult/services' },
    { icon: Share2, label: t('adult.locationShare'), color: 'text-adult-accent', route: '/adult/location' },
    { icon: BookOpen, label: t('adult.resources'), color: 'text-adult-navy', route: '/adult/resources' },
    { icon: Users, label: t('adult.trustedCircle'), color: 'text-adult-teal-light', route: '/adult/trusted-circle' },
    { icon: UserCircle, label: t('adult.account'), color: 'text-adult-navy-light', route: '/adult/account' },
  ];

  return (
    <div className="min-h-screen bg-adult-sand">
      <QuickExit />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-adult-navy text-white shadow-md">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-adult-teal-light" aria-hidden="true" />
              <span className="font-heading text-lg font-bold">{t('adult.welcome')}</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="rounded-full p-2 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label={t('common.home')}
            >
              <Home className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* SOS Banner */}
      <div className="mx-auto max-w-4xl px-4 pt-4">
        <button
          onClick={() => navigate('/adult/emergency')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-danger px-6 py-4 text-white shadow-lg transition-all hover:bg-danger-dark active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-danger/40 animate-pulse-soft"
        >
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          <span className="font-heading text-lg font-bold">{t('adult.sos')} — {t('adult.emergency')}</span>
        </button>
      </div>

      {/* Report a GBV Incident */}
      <div className="mx-auto max-w-4xl px-4 pt-3">
        <button
          onClick={() => navigate('/adult/report')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-adult-accent px-6 py-4 text-white shadow-lg transition-all hover:bg-adult-accent-light active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-adult-accent/40"
        >
          <FileText className="h-6 w-6" aria-hidden="true" />
          <span className="font-heading text-lg font-bold">Report a GBV Incident</span>
        </button>
      </div>

      {/* Check Report Status */}
      <div className="mx-auto max-w-4xl px-4 pt-3">
        <button
          onClick={() => navigate('/adult/report-status')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-adult-navy shadow-sm ring-1 ring-adult-sand-dark transition-all hover:shadow-md"
        >
          <Search className="h-5 w-5 text-adult-teal" aria-hidden="true" />
          <span className="font-heading text-sm font-bold">Check My Report Status</span>
        </button>
      </div>

      {/* Menu grid */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.route}
                onClick={() => navigate(item.route)}
                className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark transition-all hover:shadow-md hover:ring-adult-teal/20 focus:outline-none focus:ring-2 focus:ring-adult-teal/40"
              >
                <Icon className={`h-8 w-8 ${item.color}`} aria-hidden="true" />
                <span className="font-heading text-sm font-semibold text-adult-navy text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Emergency Directory quick access */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/adult/emergency')}
            className="w-full rounded-2xl bg-adult-teal px-6 py-4 text-center font-heading font-bold text-white shadow-md transition-all hover:bg-adult-teal-light active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-adult-teal/40"
          >
            {t('emergency.title')}
          </button>
        </div>

        {/* Continue without account */}
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
          <p className="text-sm text-adult-navy/70">
            You can use emergency contacts, location sharing, and anonymous reporting without an account.
            An account is only needed for your Trusted Circle and saved reports.
          </p>
        </div>

        {/* Language selector */}
        <div className="mt-6 flex justify-center">
          <LanguageSelector compact />
        </div>
      </div>
    </div>
  );
}
