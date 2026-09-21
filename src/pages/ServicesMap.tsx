import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Phone, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase, type SupportService } from '@/lib/supabase';
import { haversineDistance } from '@/lib/utils';
import { QuickExit } from '@/components/QuickExit';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SERVICE_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'police', label: 'Police' },
  { value: 'thuthuzela', label: 'Thuthuzela Care Centre' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'clinic', label: 'Clinic / Hospital' },
  { value: 'counselling', label: 'Counselling' },
  { value: 'legal_aid', label: 'Legal Aid' },
];

const TYPE_COLORS: Record<string, string> = {
  police: 'text-blue-600',
  thuthuzela: 'text-adult-accent',
  shelter: 'text-danger',
  clinic: 'text-green-600',
  counselling: 'text-adult-teal',
  legal_aid: 'text-adult-navy',
};

export function ServicesMap() {
  const { t } = useTranslation();
  const [services, setServices] = useState<SupportService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [filter, setFilter] = useState('all');
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase
        .from('support_services')
        .select('*')
        .order('name');
      if (err) throw err;
      setServices(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const findNearMe = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
      },
      () => {
        setGettingLocation(false);
        alert('Could not get your location. Please check your browser settings.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredSorted = useMemo(() => {
    let result = services;
    if (filter !== 'all') {
      result = result.filter((s) => s.type === filter);
    }
    if (userPos) {
      result = [...result].sort((a, b) => {
        const da = haversineDistance(userPos.lat, userPos.lng, a.latitude, a.longitude);
        const db = haversineDistance(userPos.lat, userPos.lng, b.latitude, b.longitude);
        return da - db;
      });
    }
    return result;
  }, [services, filter, userPos]);

  const mapCenter: [number, number] = userPos
    ? [userPos.lat, userPos.lng]
    : [-28.5, 24.9];

  return (
    <div className="min-h-screen bg-adult-sand">
      <QuickExit />

      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="font-heading text-xl font-bold text-adult-navy">{t('adult.services')}</h1>
          <p className="font-body text-sm text-adult-navy/60">Find verified support services near you.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-5">
        {/* Controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={findNearMe}
            disabled={gettingLocation}
            className="inline-flex items-center gap-2 rounded-full bg-adult-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-adult-teal-light disabled:opacity-50"
          >
            {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            Near Me
          </button>
          {userPos && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-2 text-xs font-semibold text-green-700">
              <MapPin className="h-3.5 w-3.5" /> Location found
            </span>
          )}
        </div>

        {/* Type filters */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {SERVICE_TYPES.map((st) => (
            <button
              key={st.value}
              onClick={() => setFilter(st.value)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === st.value
                  ? 'bg-adult-teal text-white shadow-sm'
                  : 'bg-white text-adult-navy/70 border border-adult-sand-dark hover:bg-adult-sand'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-adult-teal" />
            <p className="mt-3 text-sm text-adult-navy/60">Loading services...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-danger" />
            <p className="mt-3 text-sm text-adult-navy/70">Could not load services.</p>
            <button onClick={loadServices} className="mt-4 rounded-full bg-adult-teal px-5 py-2.5 text-sm font-semibold text-white">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Map */}
            <div className="mb-5 overflow-hidden rounded-2xl shadow-md" style={{ height: '350px' }}>
              <MapContainer center={mapCenter} zoom={userPos ? 13 : 6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {userPos && (
                  <Marker position={[userPos.lat, userPos.lng]}>
                    <Popup>You are here</Popup>
                  </Marker>
                )}
                {filteredSorted.map((s) => (
                  <Marker key={s.id} position={[s.latitude, s.longitude]}>
                    <Popup>
                      <strong>{s.name}</strong>
                      <br />
                      {s.address || ''}
                      {s.phone && (<><br />📞 {s.phone}</>)}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredSorted.length === 0 && (
                <p className="py-8 text-center text-sm text-adult-navy/50">No services found in this category.</p>
              )}
              {filteredSorted.map((s) => {
                const distance = userPos
                  ? haversineDistance(userPos.lat, userPos.lng, s.latitude, s.longitude)
                  : null;
                return (
                  <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-bold text-adult-navy">{s.name}</h3>
                          <span className={`text-xs font-semibold capitalize ${TYPE_COLORS[s.type] || 'text-gray-600'}`}>
                            {s.type.replace('_', ' ')}
                          </span>
                          {!s.is_verified && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              Verify before launch
                            </span>
                          )}
                        </div>
                        {s.address && <p className="mt-1 text-sm text-adult-navy/70">{s.address}</p>}
                        {s.description && <p className="mt-1 text-xs text-adult-navy/50">{s.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-adult-navy/50">
                          {s.hours && <span>{s.hours}</span>}
                          {distance !== null && (
                            <span className="font-semibold text-adult-teal">
                              {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {s.phone && (
                      <a
                        href={`tel:${s.phone}`}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-adult-teal px-4 py-2 text-sm font-bold text-white"
                      >
                        <Phone className="h-4 w-4" /> {s.phone}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
