import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCircle, LogIn, UserPlus, LogOut, Shield, Eye, EyeOff, Download, Trash2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { QuickExit } from '@/components/QuickExit';
import { useNavigate } from 'react-router-dom';

export function Account() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session, profile, loading, signIn, signUp, signOut } = useAuth();
  const { discreetMode, setDiscreetMode, reduceMotion, setReduceMotion } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dataMsg, setDataMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, displayName || email.split('@')[0]);
    if (result.error) setError(result.error);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-adult-sand">
        <QuickExit />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-adult-navy/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (session && profile) {
    return (
      <div className="min-h-screen bg-adult-sand">
        <QuickExit />
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <h1 className="font-heading text-xl font-bold text-adult-navy">{t('adult.account')}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-5 space-y-4">
          {/* Profile */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-adult-teal/10">
                <UserCircle className="h-7 w-7 text-adult-teal" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-adult-navy">{profile.display_name}</h3>
                <p className="text-sm text-adult-navy/60">{session.user.email}</p>
                <span className="mt-1 inline-block rounded-full bg-adult-accent/10 px-2.5 py-0.5 text-xs font-semibold text-adult-accent">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy controls */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark">
            <h3 className="font-heading font-bold text-adult-navy">Privacy & Settings</h3>
            <div className="mt-3 space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-adult-navy">Discreet mode (neutral app name)</span>
                <input
                  type="checkbox"
                  checked={discreetMode}
                  onChange={(e) => {
                    setDiscreetMode(e.target.checked);
                    localStorage.setItem('discreet_mode', String(e.target.checked));
                  }}
                  className="h-5 w-5 rounded accent-adult-teal"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-adult-navy">Reduce motion</span>
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(e) => {
                    setReduceMotion(e.target.checked);
                    localStorage.setItem('reduce_motion', String(e.target.checked));
                  }}
                  className="h-5 w-5 rounded accent-adult-teal"
                />
              </label>
            </div>
          </div>

          {/* Data controls */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-adult-sand-dark">
            <h3 className="font-heading font-bold text-adult-navy">Your Data</h3>
            <p className="mt-1 text-xs text-adult-navy/50">You have the right to see and delete your data.</p>
            {dataMsg.type && (
              <div className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-sm ${dataMsg.type === 'success' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-red-50 text-danger ring-1 ring-red-200'}`}>
                {dataMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                <span>{dataMsg.text}</span>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={async () => {
                  setExporting(true);
                  setDataMsg({ type: null, text: '' });
                  try {
                    const exportData: Record<string, unknown> = {};
                    const { data: contacts } = await supabase.from('trusted_contacts').select('*').eq('user_id', session.user.id);
                    exportData.trusted_contacts = contacts || [];
                    const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
                    exportData.profile = prof;
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setDataMsg({ type: 'success', text: 'Your data has been exported.' });
                  } catch {
                    setDataMsg({ type: 'error', text: 'Export failed. Please try again.' });
                  } finally {
                    setExporting(false);
                  }
                }}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-adult-sand px-4 py-2.5 text-sm font-semibold text-adult-navy disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> {exporting ? 'Exporting...' : 'Export My Data'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Are you sure? This will permanently delete your trusted contacts and profile. This cannot be undone.')) return;
                  setDeleting(true);
                  setDataMsg({ type: null, text: '' });
                  try {
                    await supabase.from('trusted_contacts').delete().eq('user_id', session.user.id);
                    await supabase.from('profiles').delete().eq('id', session.user.id);
                    await supabase.auth.signOut();
                    setDataMsg({ type: 'success', text: 'Your data has been deleted. You are now signed out.' });
                  } catch {
                    setDataMsg({ type: 'error', text: 'Deletion failed. Please try again or contact support.' });
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-danger disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting...' : 'Delete My Data'}
              </button>
            </div>
            <p className="mt-2 text-xs text-adult-navy/40">
              Anonymous reports are not linked to your account and can only be deleted using the reference code and PIN from the Report Status page.
            </p>
          </div>

          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-heading font-bold text-adult-navy shadow-sm ring-1 ring-adult-sand-dark transition-all hover:bg-adult-sand"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Login / Signup form
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-full bg-adult-teal/10 p-4">
            <Shield className="h-8 w-8 text-adult-teal" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-adult-navy">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="mt-1 text-sm text-adult-navy/60">
            {mode === 'login' ? 'Sign in to access your trusted circle and reports.' : 'Sign up to use trusted circle and reporting.'}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-adult-sand-dark">
          <div className="flex gap-1 rounded-xl bg-adult-sand p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-adult-navy shadow-sm' : 'text-adult-navy/50'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white text-adult-navy shadow-sm' : 'text-adult-navy/50'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-adult-navy/40"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-adult-teal px-6 py-3 font-heading font-bold text-white shadow-sm disabled:opacity-50"
            >
              {mode === 'login' ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-adult-sand p-3 text-xs text-adult-navy/50">
            <p className="font-semibold">Demo accounts (dev only):</p>
            <p>Admin: admin@safe.org / AdminSafe2024!</p>
            <p>User: user@safe.org / UserSafe2024!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
