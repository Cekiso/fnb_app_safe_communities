import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Search, AlertCircle, RefreshCw, CheckCircle2, Clock, Globe2 } from 'lucide-react';
import { supabase, type EmergencyContact } from '@/lib/supabase';
import { QuickExit } from '@/components/QuickExit';

const CACHE_KEY = 'emergency_contacts_cache';
const CACHE_TIME_KEY = 'emergency_contacts_cache_time';
const CATEGORIES = ['all', 'general', 'police', 'medical', 'gbv', 'child', 'mental', 'trafficking'];

export function EmergencyDirectory() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    setError(false);

    try {
      const { data, error: fetchError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      if (!data || data.length === 0) throw new Error('No data');

      setContacts(data);
      setOffline(false);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setContacts(JSON.parse(cached));
        setOffline(true);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchCategory = activeCategory === 'all' || c.category === activeCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.number.includes(q);
      return matchCategory && matchSearch;
    });
  }, [contacts, search, activeCategory]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
      general: 'bg-adult-navy/10 text-adult-navy',
      police: 'bg-adult-teal/10 text-adult-teal',
      medical: 'bg-blue-100 text-blue-700',
      gbv: 'bg-adult-accent/10 text-adult-accent',
      child: 'bg-youth-blue/10 text-youth-blue',
      mental: 'bg-green-100 text-green-700',
      trafficking: 'bg-orange-100 text-orange-700',
    };
    return map[cat] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-adult-sand">
      <QuickExit />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-xl font-bold text-adult-navy">
                {t('emergency.title')}
              </h1>
              <p className="font-body text-sm text-adult-navy/60">
                {t('emergency.subtitle')}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-adult-navy/40"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('emergency.search')}
              className="w-full rounded-full border border-adult-sand-dark bg-white py-2.5 pl-10 pr-4 font-body text-sm text-adult-navy placeholder:text-adult-navy/40 focus:outline-none focus:ring-2 focus:ring-adult-teal/30 focus:border-adult-teal"
              aria-label={t('emergency.search')}
            />
          </div>

          {/* Category filters */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-adult-teal/30 ${
                  activeCategory === cat
                    ? 'bg-adult-teal text-white shadow-sm'
                    : 'bg-white text-adult-navy/70 border border-adult-sand-dark hover:bg-adult-sand'
                }`}
                role="tab"
                aria-selected={activeCategory === cat}
              >
                {cat === 'all' ? t('emergency.all') : t(`emergency.categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-5">
        {offline && !error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{t('emergency.offlineNotice')}</span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-adult-teal" aria-hidden="true" />
            <p className="mt-3 font-body text-sm text-adult-navy/60">{t('emergency.loading')}</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-danger" aria-hidden="true" />
            <p className="mt-3 font-body text-sm text-adult-navy/70">{t('emergency.error')}</p>
            <button
              onClick={loadContacts}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-adult-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-adult-teal-light focus:outline-none focus:ring-2 focus:ring-adult-teal/40"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t('emergency.retry')}
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3 animate-fade-in">
            {filtered.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-adult-navy">{contact.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryColor(contact.category)}`}
                      >
                        {t(`emergency.categories.${contact.category}`)}
                      </span>
                      {contact.is_free && (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          {t('emergency.free')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 font-body text-sm leading-relaxed text-adult-navy/70">
                      {contact.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-adult-navy/50">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {contact.hours}
                      </span>
                      {contact.languages.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {contact.languages.join(', ')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('emergency.verifiedOn', { date: formatDate(contact.last_verified_at) })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`tel:${contact.number}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-adult-teal px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-adult-teal-light active:scale-95 focus:outline-none focus:ring-2 focus:ring-adult-teal/40"
                    aria-label={`${t('emergency.call')} ${contact.name} ${contact.number}`}
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {contact.number}
                  </a>
                  {contact.alt_number && (
                    <a
                      href={`tel:${contact.alt_number}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm font-semibold text-adult-navy transition-all hover:bg-adult-sand active:scale-95 focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                      aria-label={`${t('emergency.callAlt')} ${contact.alt_number}`}
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      {contact.alt_number}
                    </a>
                  )}
                </div>

                {/* USSD / SMS info */}
                {(contact.ussd_code || contact.sms_code) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-adult-navy/60">
                    {contact.ussd_code && (
                      <span className="rounded-lg bg-adult-sand px-2.5 py-1">
                        USSD: {contact.ussd_code}
                      </span>
                    )}
                    {contact.sms_code && (
                      <span className="rounded-lg bg-adult-sand px-2.5 py-1">
                        SMS: {contact.sms_code}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="font-body text-sm text-adult-navy/50">{t('emergency.error')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
