import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText, CheckCircle2, AlertCircle, Shield, ArrowLeft, ArrowRight,
  Phone, Lock, MapPin, Clock, Users, Heart, ChevronRight,
} from 'lucide-react';
import { QuickExit } from '@/components/QuickExit';

const INCIDENT_TYPES = [
  { value: 'physical', label: 'Physical abuse' },
  { value: 'sexual', label: 'Sexual assault' },
  { value: 'emotional', label: 'Emotional / Psychological' },
  { value: 'economic', label: 'Economic / Financial' },
  { value: 'stalking', label: 'Stalking / Harassment' },
  { value: 'online', label: 'Online abuse' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_say', label: 'Prefer not to say' },
];

const SUPPORT_OPTIONS = [
  { value: 'counselling', label: 'Counselling' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'medical', label: 'Medical care' },
  { value: 'legal', label: 'Legal help' },
  { value: 'police', label: 'Police case help' },
  { value: 'just_recording', label: 'Just recording it' },
];

const SAFETY_CONTACTS = [
  { label: 'Call 112 (Cellphone)', number: '112' },
  { label: 'Call 10111 (SAPS)', number: '10111' },
  { label: 'GBV Command Centre 0800 428 428', number: '0800428428' },
];

type FormData = {
  safetyCheck: boolean;
  consent: boolean;
  isAnonymous: boolean;
  contactName: string;
  contactPhone: string;
  contactMethod: string;
  safeTimes: string;
  incidentType: string;
  incidentDate: string;
  location: string;
  description: string;
  relationship: string;
  isOngoing: boolean;
  childrenInvolved: boolean;
  policeContacted: boolean;
  medicalContacted: boolean;
  supportRequested: string[];
};

const STEPS = ['safety', 'consent', 'how', 'what', 'who', 'support', 'review'] as const;

export function ReportForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormData>({
    safetyCheck: false,
    consent: false,
    isAnonymous: true,
    contactName: '',
    contactPhone: '',
    contactMethod: 'sms',
    safeTimes: '',
    incidentType: 'prefer_not_say',
    incidentDate: '',
    location: '',
    description: '',
    relationship: '',
    isOngoing: false,
    childrenInvolved: false,
    policeContacted: false,
    medicalContacted: false,
    supportRequested: [],
  });

  const update = (patch: Partial<FormData>) => setData({ ...data, ...patch });

  const toggleSupport = (value: string) => {
    const current = data.supportRequested;
    update({
      supportRequested: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!data.consent) {
      setError('Please tick the consent box to confirm you agree to submit this report.');
      return;
    }
    setSubmitting(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-report`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          description: data.description.trim() || 'No description provided',
          location_text: data.location.trim() || null,
          contact_details: data.isAnonymous
            ? null
            : `Name: ${data.contactName}, Phone: ${data.contactPhone}, Method: ${data.contactMethod}, Safe times: ${data.safeTimes}`,
          is_anonymous: data.isAnonymous,
          consent_given: data.consent,
          incident_type: data.incidentType,
          incident_date: data.incidentDate || null,
          is_ongoing: data.isOngoing,
          children_involved: data.childrenInvolved,
          police_contacted: data.policeContacted,
          medical_contacted: data.medicalContacted,
          support_requested: data.supportRequested,
          relationship: data.relationship || null,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }

      const result = await response.json();
      if (!result.reference_code || !result.pin) {
        throw new Error('Invalid response from server');
      }

      setReferenceCode(result.reference_code);
      setGeneratedPin(result.pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (referenceCode) {
    return (
      <div className="min-h-screen bg-adult-sand">
        <QuickExit />
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-green-100 p-5">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-adult-navy">Report Submitted</h1>
          <p className="mt-2 text-sm text-adult-navy/70">
            Thank you for your courage. Your report has been received. A responder will review it.
          </p>

          {data.childrenInvolved && (
            <div className="mt-4 w-full rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <p className="font-heading font-bold text-amber-800">Important: Child Safety</p>
              <p className="mt-1 text-sm text-amber-700">
                Because you indicated a child may be involved, please contact Childline:
              </p>
              <div className="mt-2 flex justify-center gap-3">
                <a href="tel:116" className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white">Call 116</a>
                <a href="tel:0800055555" className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white">Call 0800 055 555</a>
              </div>
            </div>
          )}

          <div className="mt-6 w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-adult-sand-dark">
            <p className="text-sm text-adult-navy/60">Your reference number is:</p>
            <p className="mt-2 font-heading text-2xl font-bold text-adult-teal">{referenceCode}</p>
            <p className="mt-3 text-sm text-adult-navy/60">Your secret PIN is:</p>
            <p className="mt-1 font-heading text-xl font-bold text-adult-accent">{generatedPin}</p>
            <p className="mt-3 text-xs text-adult-navy/50">
              Save both of these. You will need them to check your report status. Write them down somewhere safe.
            </p>
          </div>

          <button
            onClick={() => navigate('/adult/report-status')}
            className="mt-6 rounded-xl bg-adult-teal px-6 py-3 font-heading font-bold text-white shadow-sm"
          >
            Check Report Status
          </button>

          <p className="mt-6 max-w-md text-xs leading-relaxed text-adult-navy/50">
            If you are in immediate danger, call 10111 or 112 now. This report is not a substitute for emergency help.
          </p>
        </div>
      </div>
    );
  }

  const stepName = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-adult-sand">
      <QuickExit />
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <button
            onClick={() => navigate('/adult')}
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-adult-teal"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Adult Home
          </button>
          <h1 className="font-heading text-xl font-bold text-adult-navy">Report a GBV Incident</h1>
          {/* Progress bar */}
          <div className="mt-3 flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-adult-teal' : 'bg-adult-sand-dark'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-adult-navy/50">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5">
        {/* Step: Safety Check */}
        {stepName === 'safety' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-adult-sand-dark">
              <div className="mb-4 flex items-center gap-3">
                <Shield className="h-8 w-8 text-danger" />
                <h2 className="font-heading text-lg font-bold text-adult-navy">Are you in danger right now?</h2>
              </div>
              <p className="text-sm text-adult-navy/70">
                If you are in immediate danger, please call now. You can continue the report after calling.
              </p>
              <div className="mt-4 space-y-2">
                {SAFETY_CONTACTS.map((c) => (
                  <a
                    key={c.number}
                    href={`tel:${c.number}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-danger px-5 py-3 font-heading font-bold text-white shadow-sm transition-all hover:bg-danger-dark"
                  >
                    <Phone className="h-5 w-5" /> {c.label}
                  </a>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => update({ safetyCheck: true })}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    data.safetyCheck ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : 'bg-adult-sand text-adult-navy/70'
                  }`}
                >
                  Yes, I am in danger
                </button>
                <button
                  onClick={() => update({ safetyCheck: false })}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    !data.safetyCheck ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : 'bg-adult-sand text-adult-navy/70'
                  }`}
                >
                  No, I am safe now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Consent */}
        {stepName === 'consent' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-adult-sand-dark">
            <h2 className="font-heading text-lg font-bold text-adult-navy">Privacy and Consent</h2>
            <div className="mt-3 space-y-3 text-sm text-adult-navy/70">
              <p><strong>What is stored:</strong> Your report details, the type of incident, and any contact information you choose to provide.</p>
              <p><strong>Who can see it:</strong> Trained responders review reports. If you stay anonymous, they cannot see your name or contact details.</p>
              <p><strong>How long it is kept:</strong> Reports are kept while your case is active. You can delete your report at any time using your reference code and PIN.</p>
              <p><strong>How to delete it:</strong> Use the "Check Report Status" page with your reference code and PIN to request deletion.</p>
            </div>
            <label className="mt-4 flex items-start gap-3">
              <input
                type="checkbox"
                checked={data.consent}
                onChange={(e) => update({ consent: e.target.checked })}
                className="mt-0.5 h-5 w-5 rounded accent-adult-teal"
              />
              <span className="text-sm text-adult-navy">
                I understand and I consent to sharing this information for the purpose of getting help. I know I can withdraw this report at any time.
              </span>
            </label>
          </div>
        )}

        {/* Step: How to report */}
        {stepName === 'how' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-adult-sand-dark">
            <h2 className="font-heading text-lg font-bold text-adult-navy">How would you like to report?</h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => update({ isAnonymous: true })}
                className={`flex w-full items-center gap-3 rounded-xl p-4 text-left transition-all ${
                  data.isAnonymous ? 'bg-adult-teal/10 ring-1 ring-adult-teal/30' : 'bg-adult-sand'
                }`}
              >
                <Lock className="h-5 w-5 text-adult-teal" />
                <div>
                  <p className="font-heading font-bold text-adult-navy">Anonymous</p>
                  <p className="text-xs text-adult-navy/60">No name or contact details. Responders cannot contact you.</p>
                </div>
              </button>
              <button
                onClick={() => update({ isAnonymous: false })}
                className={`flex w-full items-center gap-3 rounded-xl p-4 text-left transition-all ${
                  !data.isAnonymous ? 'bg-adult-teal/10 ring-1 ring-adult-teal/30' : 'bg-adult-sand'
                }`}
              >
                <Users className="h-5 w-5 text-adult-teal" />
                <div>
                  <p className="font-heading font-bold text-adult-navy">With my contact details</p>
                  <p className="text-xs text-adult-navy/60">A responder can contact you to offer support.</p>
                </div>
              </button>
            </div>

            {!data.isAnonymous && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={data.contactName}
                  onChange={(e) => update({ contactName: e.target.value })}
                  placeholder="Your name or nickname"
                  className="w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                />
                <input
                  type="tel"
                  value={data.contactPhone}
                  onChange={(e) => update({ contactPhone: e.target.value })}
                  placeholder="Your phone or email"
                  className="w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                />
                <div>
                  <label className="text-xs font-semibold text-adult-navy/60">How is it safe to contact you?</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {['sms', 'call', 'email', 'do_not_contact'].map((m) => (
                      <button
                        key={m}
                        onClick={() => update({ contactMethod: m })}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          data.contactMethod === m ? 'bg-adult-teal text-white' : 'bg-adult-sand text-adult-navy/70'
                        }`}
                      >
                        {m === 'do_not_contact' ? 'Do not contact' : m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={data.safeTimes}
                  onChange={(e) => update({ safeTimes: e.target.value })}
                  placeholder="Safest times to contact (e.g. mornings only)"
                  className="w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                />
              </div>
            )}
          </div>
        )}

        {/* Step: What happened */}
        {stepName === 'what' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
              <label className="font-heading text-sm font-bold text-adult-navy">What type of incident?</label>
              <p className="text-xs text-adult-navy/50">Every field is optional. You do not have to answer anything you don't want to.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {INCIDENT_TYPES.map((it) => (
                  <button
                    key={it.value}
                    onClick={() => update({ incidentType: it.value })}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      data.incidentType === it.value ? 'bg-adult-teal text-white' : 'bg-adult-sand text-adult-navy/70 hover:bg-adult-sand-dark'
                    }`}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
              <label className="font-heading text-sm font-bold text-adult-navy">When did it happen? (optional)</label>
              <input
                type="datetime-local"
                value={data.incidentDate}
                onChange={(e) => update({ incidentDate: e.target.value })}
                className="mt-2 w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
              />
              <p className="mt-1 text-xs text-adult-navy/50">Approximate is fine.</p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
              <label className="font-heading text-sm font-bold text-adult-navy">Where did it happen? (optional)</label>
              <div className="mt-2 flex gap-2">
                <MapPin className="h-5 w-5 flex-shrink-0 text-adult-teal mt-2" />
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => update({ location: e.target.value })}
                  placeholder="e.g. at home, at work, in my neighbourhood"
                  className="flex-1 rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
              <label className="font-heading text-sm font-bold text-adult-navy">What would you like to tell us? (optional)</label>
              <p className="text-xs text-adult-navy/50">Only share what you are comfortable with.</p>
              <textarea
                value={data.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={4}
                className="mt-2 w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                placeholder="I would like to report..."
              />
            </div>
          </div>
        )}

        {/* Step: Who is involved */}
        {stepName === 'who' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
              <label className="font-heading text-sm font-bold text-adult-navy">Relationship to the person harmed (optional)</label>
              <input
                type="text"
                value={data.relationship}
                onChange={(e) => update({ relationship: e.target.value })}
                placeholder="e.g. partner, family member, stranger, prefer not to say"
                className="mt-2 w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
              />
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.isOngoing}
                  onChange={(e) => update({ isOngoing: e.target.checked })}
                  className="h-5 w-5 rounded accent-adult-teal"
                />
                <span className="text-sm text-adult-navy">This is ongoing</span>
              </label>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={data.childrenInvolved}
                  onChange={(e) => update({ childrenInvolved: e.target.checked })}
                  className="mt-0.5 h-5 w-5 rounded accent-adult-teal"
                />
                <span className="text-sm text-adult-navy">Children are involved or affected</span>
              </label>
              {data.childrenInvolved && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
                  <p className="text-sm font-semibold text-amber-800">Childline contacts:</p>
                  <p className="text-xs text-amber-700">Call 116 or 0800 055 555 for child protection support.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
              <p className="font-heading text-sm font-bold text-adult-navy">Have you already contacted...?</p>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={data.policeContacted}
                    onChange={(e) => update({ policeContacted: e.target.checked })}
                    className="h-5 w-5 rounded accent-adult-teal"
                  />
                  <span className="text-sm text-adult-navy">Police</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={data.medicalContacted}
                    onChange={(e) => update({ medicalContacted: e.target.checked })}
                    className="h-5 w-5 rounded accent-adult-teal"
                  />
                  <span className="text-sm text-adult-navy">Medical help</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step: Support wanted */}
        {stepName === 'support' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-adult-sand-dark">
            <h2 className="font-heading text-lg font-bold text-adult-navy">What support would you like?</h2>
            <p className="text-sm text-adult-navy/60">Select all that apply. You can choose "just recording it" if you don't want support right now.</p>
            <div className="mt-4 space-y-2">
              {SUPPORT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all ${
                    data.supportRequested.includes(opt.value)
                      ? 'bg-adult-teal/10 ring-1 ring-adult-teal/30'
                      : 'bg-adult-sand hover:bg-adult-sand-dark'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={data.supportRequested.includes(opt.value)}
                    onChange={() => toggleSupport(opt.value)}
                    className="h-5 w-5 rounded accent-adult-teal"
                  />
                  <span className="text-sm font-semibold text-adult-navy">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step: Review */}
        {stepName === 'review' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-adult-sand-dark">
              <h2 className="font-heading text-lg font-bold text-adult-navy">Review and Submit</h2>
              <p className="text-sm text-adult-navy/60">Please review your report before submitting.</p>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-adult-navy/50">Anonymous</span>
                  <span className="font-semibold text-adult-navy">{data.isAnonymous ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-adult-navy/50">Incident type</span>
                  <span className="font-semibold text-adult-navy">{INCIDENT_TYPES.find((i) => i.value === data.incidentType)?.label || 'Not specified'}</span>
                </div>
                {data.location && (
                  <div className="flex justify-between">
                    <span className="text-adult-navy/50">Location</span>
                    <span className="font-semibold text-adult-navy">{data.location}</span>
                  </div>
                )}
                {data.description && (
                  <div>
                    <span className="text-adult-navy/50">Description</span>
                    <p className="mt-1 text-adult-navy">{data.description}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-adult-navy/50">Children involved</span>
                  <span className="font-semibold text-adult-navy">{data.childrenInvolved ? 'Yes' : 'No'}</span>
                </div>
                {data.supportRequested.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-adult-navy/50">Support wanted</span>
                    <span className="font-semibold text-adult-navy">{data.supportRequested.map((s) => SUPPORT_OPTIONS.find((o) => o.value === s)?.label).join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-adult-navy/50">Consent given</span>
                  <span className="font-semibold text-adult-navy">{data.consent ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-danger ring-1 ring-red-200">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex gap-3">
          {!isFirst && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-heading font-bold text-adult-navy shadow-sm ring-1 ring-adult-sand-dark"
            >
              <ArrowLeft className="h-5 w-5" /> Back
            </button>
          )}
          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !data.consent}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-adult-teal px-6 py-3 font-heading font-bold text-white shadow-md disabled:opacity-50"
            >
              {submitting ? <Clock className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-adult-teal px-6 py-3 font-heading font-bold text-white shadow-md"
            >
              {stepName === 'safety' ? 'Continue' : 'Next'} <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
