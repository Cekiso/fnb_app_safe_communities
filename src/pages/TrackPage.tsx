import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone, AlertCircle, ExternalLink, Navigation } from 'lucide-react';
import { supabase, type LocationShareSession, type LocationPoint } from '@/lib/supabase';
import { hashToken, formatTimeAgo } from '@/lib/utils';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<LocationShareSession | null>(null);
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadSession();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const loadSession = async () => {
    if (!token) return;
    setLoading(true);
    setError(false);

    try {
      const tokenHash = await hashToken(token);
      const { data: sess, error: sessErr } = await supabase
        .from('location_share_sessions')
        .select('*')
        .eq('token_hash', tokenHash)
        .maybeSingle();

      if (sessErr) throw sessErr;
      if (!sess) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Check expiry
      let currentStatus = sess.status;
      if (sess.status === 'active' && sess.expires_at && new Date(sess.expires_at) < new Date()) {
        currentStatus = 'expired';
      }
      setSession({ ...sess, status: currentStatus });

      await loadPoints(sess.id);

      // Poll every 8 seconds if active
      if (currentStatus === 'active') {
        pollRef.current = setInterval(() => loadPoints(sess.id), 8000);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadPoints = async (sessionId: string) => {
    const { data, error: ptsErr } = await supabase
      .from('location_points')
      .select('*')
      .eq('session_id', sessionId)
      .order('recorded_at', { ascending: true })
      .limit(100);

    if (ptsErr) return;
    setPoints(data || []);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-adult-teal border-t-transparent" />
          <p className="mt-3 text-sm text-gray-600">Loading tracking link...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="mt-4 font-heading text-xl font-bold text-gray-700">Link Not Found</h1>
          <p className="mt-2 text-sm text-gray-500">This tracking link is invalid or has expired. Ask the person sharing to send a new link.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-danger" />
          <h1 className="mt-4 font-heading text-xl font-bold text-gray-700">Something went wrong</h1>
          <button onClick={loadSession} className="mt-4 rounded-full bg-adult-teal px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
        </div>
      </div>
    );
  }

  const latestPoint = points.length > 0 ? points[points.length - 1] : null;
  const isActive = session?.status === 'active';
  const trail: [number, number][] = points.map((p) => [p.latitude, p.longitude]);

  const statusBanner = () => {
    if (session?.status === 'stopped') return { text: 'Sharing Ended', color: 'bg-gray-100 text-gray-700' };
    if (session?.status === 'expired') return { text: 'Link Expired', color: 'bg-gray-100 text-gray-700' };
    return { text: 'Active — sharing now', color: 'bg-green-100 text-green-700' };
  };

  const banner = statusBanner();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status banner */}
      <div className={`sticky top-0 z-30 px-4 py-3 text-center text-sm font-bold ${banner.color}`}>
        {banner.text}
      </div>

      {latestPoint ? (
        <>
          {/* Map */}
          <div className="mx-auto max-w-3xl px-4">
            <div className="overflow-hidden rounded-2xl shadow-md" style={{ height: '300px' }}>
              <MapContainer
                center={[latestPoint.latitude, latestPoint.longitude]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {latestPoint.accuracy && (
                  <Circle
                    center={[latestPoint.latitude, latestPoint.longitude]}
                    radius={latestPoint.accuracy}
                    pathOptions={{ fillColor: '#3B82F6', fillOpacity: 0.15, stroke: false }}
                  />
                )}
                {trail.length > 1 && (
                  <Polyline positions={trail} pathOptions={{ color: '#3B82F6', weight: 3, opacity: 0.6 }} />
                )}
                <Marker position={[latestPoint.latitude, latestPoint.longitude]}>
                </Marker>
              </MapContainer>
            </div>

            {/* Info */}
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-gray-800">{session?.sender_nickname || 'Someone'}</p>
                    <p className="text-sm text-gray-500">Last updated: {formatTimeAgo(latestPoint.recorded_at)}</p>
                    {latestPoint.accuracy && (
                      <p className="text-xs text-gray-400">Accuracy: ~{Math.round(latestPoint.accuracy)}m</p>
                    )}
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
                      <span className="text-xs font-semibold text-green-600">Live</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Call buttons */}
              <div className="grid grid-cols-2 gap-3">
                {session?.sender_phone && (
                  <a
                    href={`tel:${session.sender_phone}`}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-adult-teal px-4 py-4 font-heading font-bold text-white shadow-sm"
                  >
                    <Phone className="h-5 w-5" /> Call {session.sender_nickname}
                  </a>
                )}
                <a
                  href="tel:10111"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-4 font-heading font-bold text-white shadow-sm"
                >
                  <Phone className="h-5 w-5" /> SAPS 10111
                </a>
                <a
                  href="tel:112"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-adult-navy px-4 py-4 font-heading font-bold text-white shadow-sm"
                >
                  <Phone className="h-5 w-5" /> 112
                </a>
                <a
                  href={`https://www.google.com/maps?q=${latestPoint.latitude},${latestPoint.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-heading font-bold text-adult-navy shadow-sm ring-1 ring-gray-200"
                >
                  <ExternalLink className="h-5 w-5" /> Google Maps
                </a>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <Navigation className="mx-auto h-12 w-12 text-gray-300" />
          <h1 className="mt-4 font-heading text-lg font-bold text-gray-700">Waiting for location...</h1>
          <p className="mt-2 text-sm text-gray-500">
            {isActive
              ? `${session?.sender_nickname || 'Someone'} started sharing but hasn't sent their location yet. This page will update automatically.`
              : 'No location data was shared before the session ended.'}
          </p>
        </div>
      )}
    </div>
  );
}
