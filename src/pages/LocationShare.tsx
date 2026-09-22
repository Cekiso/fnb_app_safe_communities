import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Square, AlertCircle, Loader2, MapPin, Copy, MessageCircle, Phone, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateToken, hashToken } from '@/lib/utils';
import { QuickExit } from '@/components/QuickExit';
import { useNavigate } from 'react-router';

const DURATIONS = [
  { value: 15, label: '15 minutes' },
  { value: 60, label: '1 hour' },
  { value: 240, label: '4 hours' },
  { value: 0, label: 'Until I stop' },
];

export function LocationShare() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [duration, setDuration] = useState(15);
  const [activeSession, setActiveSession] = useState<{ id: string; token: string; link: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState('');
  const watchIdRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startSharing = async () => {
    setError(null);
    setCreating(true);

    try {
      const token = generateToken();
      const tokenHash = await hashToken(token);
      const expiresAt = duration > 0
        ? new Date(Date.now() + duration * 60 * 1000).toISOString()
        : null;

      const { data, error: err } = await supabase
        .from('location_share_sessions')
        .insert({
          token_hash: tokenHash,
          sender_nickname: nickname.trim() || 'Anonymous',
          sender_phone: phone.trim() || null,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (err) throw err;

      sessionIdRef.current = data.id;
      tokenRef.current = token;
      const link = `${window.location.origin}/track/${token}`;
      setActiveSession({ id: data.id, token, link });
      setStatus('Sharing started. Sending your location...');

      // Start watching position
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            await supabase.from('location_points').insert({
              session_id: data.id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
            setStatus(`Last update: ${new Date().toLocaleTimeString()}`);
          },
          (geoErr) => {
            setStatus(`Location error: ${geoErr.message}`);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      }

      // Try wake lock
      if ('wakeLock' in navigator) {
        try {
          await navigator.wakeLock.request('screen');
        } catch {
          // Wake lock not available or denied
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start sharing.');
    } finally {
      setCreating(false);
    }
  };

  const stopSharing = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sessionIdRef.current) {
      await supabase
        .from('location_share_sessions')
        .update({ status: 'stopped', stopped_at: new Date().toISOString() })
        .eq('id', sessionIdRef.current);
    }
    setActiveSession(null);
    sessionIdRef.current = null;
    setStatus('');
  };

  const copyLink = () => {
    if (activeSession) {
      navigator.clipboard.writeText(activeSession.link);
      setStatus('Link copied!');
    }
  };

  const smsCompose = () => {
    if (activeSession) {
      const message = `I'm sharing my live location with you because I may need help. Open: ${activeSession.link}`;
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    }
  };

  const whatsappShare = () => {
    if (activeSession) {
      const message = `I'm sharing my live location with you because I may need help. Open: ${activeSession.link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  if (activeSession) {
    return (
      <div className="min-h-screen bg-adult-sand">
        <QuickExit />
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <button
            onClick={() => navigate('/adult')}
            className="flex items-center gap-2 rounded-full bg-youth-cream px-4 py-2 text-sm font-semibold text-youth-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </header>
        <div className="mx-auto max-w-lg px-4 py-6">
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200">
            <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
            <p className="font-heading font-bold text-green-700">You are sharing your location</p>
          </div>

          <p className="text-sm text-adult-navy/70">{status}</p>

          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
            <p className="text-xs font-semibold text-adult-navy/50">Your tracking link:</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-adult-sand px-3 py-2 text-xs text-adult-navy">{activeSession.link}</code>
              <button onClick={copyLink} className="rounded-lg bg-adult-teal/10 p-2 text-adult-teal" aria-label="Copy link">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button onClick={smsCompose} className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 shadow-sm ring-1 ring-adult-sand-dark">
              <MessageCircle className="h-6 w-6 text-adult-teal" />
              <span className="text-xs font-semibold text-adult-navy">SMS</span>
            </button>
            <button onClick={whatsappShare} className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 shadow-sm ring-1 ring-adult-sand-dark">
              <Phone className="h-6 w-6 text-green-600" />
              <span className="text-xs font-semibold text-adult-navy">WhatsApp</span>
            </button>
            <button onClick={copyLink} className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 shadow-sm ring-1 ring-adult-sand-dark">
              <Copy className="h-6 w-6 text-adult-navy" />
              <span className="text-xs font-semibold text-adult-navy">Copy</span>
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
            <p>Keep this app open and your screen on. Browsers cannot track location when the screen is off or the app is in the background. Keep your phone charged.</p>
          </div>

          <button
            onClick={stopSharing}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-danger px-6 py-4 font-heading font-bold text-white shadow-md transition-all hover:bg-danger-dark"
          >
            <Square className="h-5 w-5" /> Stop Sharing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-adult-sand">
      <QuickExit />
      
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <h1 className="font-heading text-xl font-bold text-adult-navy">{t('adult.locationShare')}</h1>
          <p className="text-sm text-adult-navy/60">Share your live location with people you trust. They just open a link — no app needed.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark">
          <label className="font-heading text-sm font-bold text-adult-navy">Your nickname (seen by recipient)</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Thandi"
            className="mt-2 w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark">
          <label className="font-heading text-sm font-bold text-adult-navy">Your phone (optional, for SOS)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0821234567"
            className="mt-2 w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark">
          <label className="font-heading text-sm font-bold text-adult-navy">How long to share?</label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  duration === d.value
                    ? 'bg-adult-teal text-white'
                    : 'bg-adult-sand text-adult-navy/70 hover:bg-adult-sand-dark'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-danger ring-1 ring-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={startSharing}
          disabled={creating}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-adult-teal px-6 py-4 font-heading font-bold text-white shadow-md transition-all hover:bg-adult-teal-light disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
          {creating ? 'Starting...' : 'Start Sharing My Location'}
        </button>

        <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
          <p className="font-semibold">Important:</p>
          <p className="mt-1">Your location is shared via a secure, random link. No one can see your location without the link. You can stop sharing at any time. Location data is deleted after the session ends.</p>
        </div>
      </div>
    </div>
  );
}
