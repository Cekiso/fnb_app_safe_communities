import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, AlertCircle, CheckCircle2, Clock, ArrowLeft, Trash2 } from 'lucide-react';
import { QuickExit } from '@/components/QuickExit';

export function ReportStatus() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [refCode, setRefCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{
    status: string;
    created_at: string;
    updated_at: string;
    report_type: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  const STATUS_LABELS: Record<string, string> = {
    submitted: 'Submitted — waiting for a responder to review it',
    received: 'Received — a responder has seen your report',
    in_review: 'In Review — a responder is looking into your report',
    support_offered: 'Support Offered — a responder has offered help',
    referred: 'Referred — your report has been referred to a service',
    closed: 'Closed — your report has been resolved',
  };

  const handleCheck = async () => {
    setError(null);
    if (!refCode.trim() || !pin.trim()) {
      setError('Please enter both your reference code and your PIN.');
      return;
    }
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-status`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          reference_code: refCode.trim().toUpperCase(),
          pin: pin.trim(),
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      if (!data.found) {
        setError('No report found with that reference code and PIN. Check your details and try again.');
        return;
      }
      setReport({
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        report_type: data.report_type,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check report status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-adult-sand">
      <QuickExit />
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <button
            onClick={() => navigate('/adult')}
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-adult-teal"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-heading text-xl font-bold text-adult-navy">Check Report Status</h1>
          <p className="text-sm text-adult-navy/60">
            Enter your reference code and the PIN you created when you submitted the report.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5">
        {report ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-adult-sand-dark">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h2 className="font-heading text-lg font-bold text-adult-navy">Report Found</h2>
                <p className="text-sm text-adult-navy/60">Reference: {refCode.trim().toUpperCase()}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-adult-sand p-4">
                <p className="text-xs font-semibold text-adult-navy/50">Current Status</p>
                <p className="mt-1 font-heading font-bold text-adult-teal">
                  {STATUS_LABELS[report.status] || report.status}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-adult-sand p-4">
                  <p className="text-xs font-semibold text-adult-navy/50">Submitted</p>
                  <p className="mt-1 text-sm text-adult-navy">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-xl bg-adult-sand p-4">
                  <p className="text-xs font-semibold text-adult-navy/50">Last Updated</p>
                  <p className="mt-1 text-sm text-adult-navy">
                    {new Date(report.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setReport(null); setRefCode(''); setPin(''); setDeleteMsg(null); }}
              className="mt-4 w-full rounded-xl bg-adult-sand px-4 py-2.5 text-sm font-semibold text-adult-navy"
            >
              Check Another Report
            </button>

            {deleteMsg && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-700 ring-1 ring-green-200">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <span>{deleteMsg}</span>
              </div>
            )}

            <button
              onClick={async () => {
                if (!confirm('Are you sure? This will permanently delete your report. This cannot be undone.')) return;
                setDeleting(true);
                setDeleteMsg(null);
                try {
                  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-report`;
                  const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({
                      reference_code: refCode.trim().toUpperCase(),
                      pin: pin.trim(),
                    }),
                  });
                  if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}));
                    throw new Error(errBody.error || 'Delete failed');
                  }
                  setDeleteMsg('Your report has been permanently deleted.');
                  setReport(null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not delete report.');
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-danger disabled:opacity-50"
            >
              {deleting ? <Clock className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? 'Deleting...' : 'Delete This Report'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-adult-sand-dark">
            <div className="space-y-4">
              <div>
                <label className="font-heading text-sm font-bold text-adult-navy">Reference Code</label>
                <p className="text-xs text-adult-navy/50">e.g. GBV-7K3P-9XQ2</p>
                <input
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="GBV-XXXX-XXXX"
                  className="mt-2 w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                />
              </div>
              <div>
                <label className="font-heading text-sm font-bold text-adult-navy">PIN</label>
                <p className="text-xs text-adult-navy/50">The secret PIN you chose when submitting the report.</p>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Your PIN"
                  className="mt-2 w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-danger ring-1 ring-red-200">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleCheck}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-adult-teal px-6 py-3 font-heading font-bold text-white shadow-sm disabled:opacity-50"
              >
                {loading ? <Clock className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
