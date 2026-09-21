import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HeartCrack,
  Frown,
  Compass,
  MessageCircleHeart,
  HelpCircle,
  Phone,
  MapPin,
  Share2,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { QuickExit } from '@/components/QuickExit';

const REASONS = [
  { icon: HeartCrack, label: 'Someone is hurting me', color: 'bg-youth-coral' },
  { icon: Frown, label: "I'm scared", color: 'bg-youth-lavender' },
  { icon: Compass, label: "I'm lost", color: 'bg-youth-blue' },
  { icon: MessageCircleHeart, label: 'I need to talk to someone', color: 'bg-youth-mint' },
  { icon: HelpCircle, label: 'Something is not okay', color: 'bg-youth-yellow' },
];

export function YouthHelp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  if (selectedReason) {
    return (
      <div className="min-h-screen bg-youth-cream">
        <QuickExit />
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <button
              onClick={() => setSelectedReason(null)}
              className="flex items-center gap-2 rounded-full bg-youth-cream px-4 py-2 text-sm font-semibold text-youth-navy"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-6">
          {/* Encouraging message */}
          <div className="mb-6 rounded-3xl bg-white p-6 text-center shadow-sm">
            <span className="text-4xl">🦉</span>
            <p className="mt-2 font-heading text-lg font-bold text-youth-navy">
              You did the right thing by asking for help.
            </p>
            <p className="mt-1 font-body text-sm text-youth-navy/70">It is not your fault.</p>
          </div>

          {/* Call Childline */}
          <a
            href="tel:116"
            className="mb-3 flex w-full items-center justify-center gap-3 rounded-3xl bg-youth-mint px-6 py-5 font-heading text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
          >
            <Phone className="h-7 w-7" />
            Call Childline 116 (Free)
          </a>

          {/* Call a Trusted Adult */}
          <button
            onClick={() => navigate('/youth/safe-people')}
            className="mb-3 flex w-full items-center justify-center gap-3 rounded-3xl bg-youth-blue px-6 py-5 font-heading text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
          >
            <Phone className="h-7 w-7" />
            Call a Trusted Adult
          </button>

          {/* Share location */}
          <button
            onClick={() => navigate('/youth/unsafe')}
            className="mb-3 flex w-full items-center justify-center gap-3 rounded-3xl bg-youth-lavender px-6 py-5 font-heading text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
          >
            <Share2 className="h-7 w-7" />
            Share My Location with Safe People
          </button>

          {/* Emergency only */}
          <div className="mt-6 rounded-3xl bg-red-50 p-4 ring-1 ring-red-200">
            <p className="mb-3 text-center font-heading text-sm font-bold text-danger">
              Only if you are in danger right now
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-5 font-heading font-bold text-white shadow-md transition-all hover:bg-danger-dark active:scale-95"
              >
                <Phone className="h-6 w-6" /> 112
              </a>
              <a
                href="tel:10111"
                className="flex items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-5 font-heading font-bold text-white shadow-md transition-all hover:bg-danger-dark active:scale-95"
              >
                <Phone className="h-6 w-6" /> 10111
              </a>
            </div>
          </div>

          <button
            onClick={() => navigate('/youth')}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-heading font-semibold text-youth-navy shadow-sm"
          >
            <Home className="h-5 w-5" /> Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-youth-cream">
      <QuickExit />
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <button
            onClick={() => navigate('/youth')}
            className="flex items-center gap-2 rounded-full bg-youth-cream px-4 py-2 text-sm font-semibold text-youth-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 text-center">
          <span className="text-4xl">🦉</span>
          <h1 className="mt-2 font-heading text-2xl font-bold text-youth-navy">What is happening?</h1>
          <p className="mt-1 font-body text-sm text-youth-navy/60">Tap one. You are brave for asking.</p>
        </div>

        <div className="space-y-3">
          {REASONS.map((reason) => {
            const Icon = reason.icon;
            return (
              <button
                key={reason.label}
                onClick={() => setSelectedReason(reason.label)}
                className={`flex w-full items-center gap-4 rounded-3xl ${reason.color} px-6 py-5 text-left font-heading text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.97]`}
              >
                <Icon className="h-8 w-8 flex-shrink-0" />
                {reason.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
