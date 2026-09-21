import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Square, MapPin, Phone, Wind } from 'lucide-react';
import { QuickExit } from '@/components/QuickExit';
import { supabase } from '@/lib/supabase';
import { generateToken, hashToken } from '@/lib/utils';
import type { SafePerson } from '@/lib/supabase';

export function YouthUnsafe() {
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);
  const [safePeople, setSafePeople] = useState<SafePerson[]>([]);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('youth_safe_people');
    if (stored) setSafePeople(JSON.parse(stored));
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const startSharing = async () => {
    setSharing(true);
    const token = generateToken();
    const tokenHash = await hashToken(token);
    const link = `${window.location.origin}/track/${token}`;

    try {
      const { data } = await supabase.from('location_share_sessions').insert({
        token_hash: tokenHash,
        sender_nickname: 'Young Person',
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }).select().single();

      if (data && 'geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(async (pos) => {
          await supabase.from('location_points').insert({
            session_id: data.id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        }, () => {}, { enableHighAccuracy: true, maximumAge: 5000 });
      }

      // Open SMS with all safe people's numbers
      const message = `I don't feel safe. I'm sharing my location: ${link}`;
      window.location.href = `sms:${safePeople.map((p) => p.phone).join(',')}?body=${encodeURIComponent(message)}`;
    } catch {
      setSharing(false);
    }
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  };

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
          <h1 className="mt-2 font-heading text-2xl font-bold text-youth-navy">I don't feel safe</h1>
          <p className="mt-1 font-body text-sm text-youth-navy/60">Let's get you to a safe place. I am here with you.</p>
        </div>

        {/* Breathing animation */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-youth-lavender/20 animate-breathe">
            <Wind className="h-12 w-12 text-youth-lavender" />
          </div>
          <p className="mt-3 font-heading text-base font-semibold text-youth-navy">Breathe in... breathe out...</p>
        </div>

        {sharing ? (
          <div className="rounded-3xl bg-green-50 p-5 text-center ring-1 ring-green-200">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
              <p className="font-heading font-bold text-green-700">You are sharing your location</p>
            </div>
            <p className="text-sm text-green-600">Your safe people are being contacted. Keep breathing.</p>
            <button
              onClick={stopSharing}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-heading font-bold text-youth-navy shadow-sm"
            >
              <Square className="h-5 w-5" /> Stop Sharing
            </button>
          </div>
        ) : (
          <button
            onClick={startSharing}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-3xl bg-youth-lavender px-6 py-5 font-heading text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
          >
            <MapPin className="h-7 w-7" /> Share My Location with Safe People
          </button>
        )}

        {/* Go to a safe place */}
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-youth-navy">Go to a safe place</h2>
          <p className="mt-1 text-sm text-youth-navy/60">A safe place is somewhere with people who can help you.</p>
          <div className="mt-3 space-y-2">
            {[
              { icon: '👮', label: 'Police station' },
              { icon: '🏥', label: 'Clinic or hospital' },
              { icon: '🏫', label: 'School' },
              { icon: '📚', label: 'Library' },
              { icon: '🏪', label: 'A shop with lots of people' },
            ].map((place) => (
              <div key={place.label} className="flex items-center gap-3 rounded-2xl bg-youth-cream p-3">
                <span className="text-2xl">{place.icon}</span>
                <span className="font-heading font-semibold text-youth-navy">{place.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call Childline */}
        <a
          href="tel:116"
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-3xl bg-youth-mint px-6 py-5 font-heading text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
        >
          <Phone className="h-7 w-7" /> Call Childline 116 (Free)
        </a>

        {safePeople.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-center text-sm font-semibold text-youth-navy/60">Your safe people:</p>
            {safePeople.map((p) => (
              <a
                key={p.id}
                href={`tel:${p.phone}`}
                className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <p className="font-heading font-bold text-youth-navy">{p.name}</p>
                  <p className="text-sm text-youth-blue">{p.phone}</p>
                </div>
                <Phone className="ml-auto h-5 w-5 text-youth-blue" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
