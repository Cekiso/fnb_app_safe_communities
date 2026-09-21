import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertCircle, RefreshCw, ChevronRight, ArrowLeft,
  Eye, MessageSquare, Clock, Flag, User, Download, Trash2, Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { QuickExit } from '@/components/QuickExit';

const STATUS_FLOW = ['submitted', 'received', 'in_review', 'support_offered', 'referred', 'closed'] as const;

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  received: 'Received',
  in_review: 'In Review',
  support_offered: 'Support Offered',
  referred: 'Referred',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  received: 'bg-cyan-100 text-cyan-700',
  in_review: 'bg-amber-100 text-amber-700',
  support_offered: 'bg-green-100 text-green-700',
  referred: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-700',
};

type ReportListItem = {
  id: string;
  reference_code: string;
  report_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  incident_type: string | null;
  is_anonymous: boolean;
  children_involved: boolean;
  priority: string;
  assigned_to: string | null;
};

type ReportDetail = ReportListItem & {
  description: string;
  location_text: string | null;
  contact_details: string | null;
  consent_given: boolean;
  incident_date: string | null;
  is_ongoing: boolean;
  police_contacted: boolean;
  medical_contacted: boolean;
  support_requested: string[];
  relationship: string | null;
  encryption_iv: string | null;
  encrypted_fields: string[];
  messages: ReportMessage[];
};

type ReportMessage = {
  id: string;
  sender_type: string;
  message_text: string;
  read_by_reporter: boolean;
  read_by_responder: boolean;
  created_at: string;
};

export function ResponderDashboard() {
  const navigate = useNavigate();
  const { session, profile, loading: authLoading, isResponder } = useAuth();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [exporting, setExporting] = useState(false);

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/responder-api`;

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  }), [session]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiUrl}/reports?status=${filterStatus}&limit=100`,
        { headers: authHeaders() }
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, authHeaders, filterStatus]);

  useEffect(() => {
    if (!authLoading && !isResponder) {
      navigate('/adult');
    }
  }, [authLoading, isResponder, navigate]);

  useEffect(() => {
    if (isResponder && session) {
      loadReports();
    }
  }, [isResponder, session, filterStatus, loadReports]);

  const loadReportDetail = async (reportId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`${apiUrl}/reports/${reportId}`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }
      const data = await response.json();
      setSelectedReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load report.');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`${apiUrl}/reports/${reportId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          status: newStatus,
          note: null,
          responder_name: profile?.display_name || 'Responder',
        }),
      });
      if (!response.ok) throw new Error('Failed to update status');

      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
      setReports(reports.map((r) => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedReport) return;
    setSendingMessage(true);
    try {
      const response = await fetch(`${apiUrl}/reports/${selectedReport.id}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      await loadReportDetail(selectedReport.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const exportReport = async (reportId: string) => {
    setExporting(true);
    try {
      const response = await fetch(`${apiUrl}/reports/${reportId}/export`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-adult-sand">
        <QuickExit />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-adult-navy/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isResponder) {
    return (
      <div className="min-h-screen bg-adult-sand">
        <QuickExit />
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          <Shield className="h-12 w-12 text-danger/50" />
          <h1 className="mt-4 font-heading text-xl font-bold text-adult-navy">Access Restricted</h1>
          <p className="mt-2 text-sm text-adult-navy/60">
            This area is for responders and admins only. Sign in with a responder account to access the dashboard.
          </p>
          <button
            onClick={() => navigate('/adult/account')}
            className="mt-6 rounded-full bg-adult-teal px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Report detail view
  if (selectedReport) {
    return (
      <div className="min-h-screen bg-adult-sand">
        <QuickExit />
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <button
              onClick={() => setSelectedReport(null)}
              className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-adult-teal"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Queue
            </button>
            <h1 className="font-heading text-xl font-bold text-adult-navy">Report {selectedReport.reference_code}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-5 space-y-4">
          {detailLoading && (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin text-adult-teal" />
            </div>
          )}

          {!detailLoading && (
            <>
              {/* Status */}
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-adult-navy/50">Current Status</p>
                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold ${STATUS_COLORS[selectedReport.status]}`}>
                      {STATUS_LABELS[selectedReport.status] || selectedReport.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-adult-navy/50">Submitted</p>
                    <p className="text-sm text-adult-navy">{new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-adult-navy/50">Change Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FLOW.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selectedReport.id, s)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                          selectedReport.status === s
                            ? 'bg-adult-teal text-white'
                            : 'bg-adult-sand text-adult-navy/70 hover:bg-adult-sand-dark'
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Report details */}
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-adult-navy">Report Details</h3>
                  <button
                    onClick={() => exportReport(selectedReport.id)}
                    disabled={exporting}
                    className="flex items-center gap-1.5 rounded-lg bg-adult-sand px-3 py-1.5 text-xs font-semibold text-adult-navy disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" /> {exporting ? 'Exporting...' : 'Export'}
                  </button>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Flag className="h-4 w-4 flex-shrink-0 text-adult-teal mt-0.5" />
                    <div>
                      <span className="font-semibold text-adult-navy">Type: </span>
                      <span className="text-adult-navy/70">{selectedReport.incident_type || selectedReport.report_type}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <User className="h-4 w-4 flex-shrink-0 text-adult-teal mt-0.5" />
                    <div>
                      <span className="font-semibold text-adult-navy">Anonymous: </span>
                      <span className="text-adult-navy/70">{selectedReport.is_anonymous ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  {selectedReport.children_involved && (
                    <div className="flex gap-2">
                      <Flag className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
                      <span className="font-semibold text-amber-700">Children involved</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Eye className="h-4 w-4 flex-shrink-0 text-adult-teal mt-0.5" />
                    <div>
                      <span className="font-semibold text-adult-navy">Description: </span>
                      <p className="mt-1 text-adult-navy/70">{selectedReport.description}</p>
                    </div>
                  </div>
                  {selectedReport.location_text && (
                    <div className="flex gap-2">
                      <Flag className="h-4 w-4 flex-shrink-0 text-adult-teal mt-0.5" />
                      <div>
                        <span className="font-semibold text-adult-navy">Location: </span>
                        <span className="text-adult-navy/70">{selectedReport.location_text}</span>
                      </div>
                    </div>
                  )}
                  {!selectedReport.is_anonymous && selectedReport.contact_details && (
                    <div className="flex gap-2">
                      <User className="h-4 w-4 flex-shrink-0 text-adult-teal mt-0.5" />
                      <div>
                        <span className="font-semibold text-adult-navy">Contact: </span>
                        <span className="text-adult-navy/70">{selectedReport.contact_details}</span>
                      </div>
                    </div>
                  )}
                  {selectedReport.priority === 'high' && (
                    <div className="flex gap-2">
                      <Flag className="h-4 w-4 flex-shrink-0 text-danger mt-0.5" />
                      <span className="font-semibold text-danger">High Priority</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark">
                <h3 className="font-heading font-bold text-adult-navy">Secure Messages</h3>
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {(!selectedReport.messages || selectedReport.messages.length === 0) && (
                    <p className="text-sm text-adult-navy/50">No messages yet.</p>
                  )}
                  {selectedReport.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl p-3 text-sm ${
                        msg.sender_type === 'responder'
                          ? 'bg-adult-teal/10 text-adult-navy ml-8'
                          : 'bg-adult-sand text-adult-navy mr-8'
                      }`}
                    >
                      <p className="text-xs font-semibold text-adult-navy/50 mb-1">
                        {msg.sender_type === 'responder' ? 'You' : 'Reporter'} - {new Date(msg.created_at).toLocaleString()}
                      </p>
                      <p>{msg.message_text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a secure message..."
                    className="flex-1 rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="rounded-xl bg-adult-teal px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {sendingMessage ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-adult-sand">
      <QuickExit />
      <div className="sticky top-0 z-30 bg-adult-navy text-white shadow-md">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-adult-teal-light" />
              <h1 className="font-heading text-lg font-bold">Responder Dashboard</h1>
            </div>
            <button
              onClick={() => navigate('/adult')}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-5">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-danger ring-1 ring-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-danger/60">Dismiss</button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {['all', ...STATUS_FLOW].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterStatus === s
                  ? 'bg-adult-teal text-white'
                  : 'bg-white text-adult-navy/70 border border-adult-sand-dark hover:bg-adult-sand'
              }`}
            >
              {s === 'all' ? 'All Reports' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-adult-teal" />
            <p className="mt-3 text-sm text-adult-navy/60">Loading reports...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-3">
            {reports.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-adult-navy/50">No reports found.</p>
              </div>
            )}
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => loadReportDetail(report.id)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-adult-sand-dark transition-all hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-bold text-adult-navy">{report.reference_code}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[report.status]}`}>
                      {STATUS_LABELS[report.status] || report.status}
                    </span>
                    {report.priority === 'high' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-danger">High Priority</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-adult-navy/50">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    <span>{report.incident_type || report.report_type}</span>
                    {report.is_anonymous && <span className="text-adult-accent">Anonymous</span>}
                    {report.children_involved && <span className="text-amber-600 font-semibold">Children</span>}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-adult-navy/40" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
