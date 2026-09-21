import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Trash2, AlertCircle, Phone } from 'lucide-react';
import { supabase, type TrustedContact } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { QuickExit } from '@/components/QuickExit';

export function TrustedCircle() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (session) loadContacts();
  }, [session]);

  const loadContacts = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase
        .from('trusted_contacts')
        .select('*')
        .order('created_at');
      if (err) throw err;
      setContacts(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      setAddError('Name and phone number are required.');
      return;
    }
    setAddError(null);
    try {
      const { error: err } = await supabase.from('trusted_contacts').insert({
        name: newName.trim(),
        phone: newPhone.trim(),
        relationship: newRelationship.trim() || null,
      });
      if (err) throw err;
      setNewName('');
      setNewPhone('');
      setNewRelationship('');
      setShowAdd(false);
      loadContacts();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not add contact.');
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await supabase.from('trusted_contacts').delete().eq('id', id);
      setContacts(contacts.filter((c) => c.id !== id));
    } catch {
      alert('Could not delete contact.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-adult-sand">
        <QuickExit />
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          <Users className="h-12 w-12 text-adult-teal/50" />
          <h1 className="mt-4 font-heading text-xl font-bold text-adult-navy">Sign in required</h1>
          <p className="mt-2 text-sm text-adult-navy/60">You need an account to manage your Trusted Circle. Your contacts are stored securely and only visible to you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-adult-sand">
      <QuickExit />
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="font-heading text-xl font-bold text-adult-navy">{t('adult.trustedCircle')}</h1>
          <p className="text-sm text-adult-navy/60">People you trust. You can share your location with them instantly.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5">
        {loading && <p className="py-8 text-center text-sm text-adult-navy/60">Loading...</p>}
        {error && (
          <div className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-danger" />
            <p className="mt-3 text-sm text-adult-navy/70">Could not load your contacts.</p>
            <button onClick={loadContacts} className="mt-4 rounded-full bg-adult-teal px-5 py-2.5 text-sm font-semibold text-white">Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="space-y-3">
              {contacts.length === 0 && (
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-adult-sand-dark">
                  <p className="text-sm text-adult-navy/60">No trusted contacts yet. Add people you trust to share your location with them in an emergency.</p>
                </div>
              )}
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-adult-teal/10 font-heading text-lg font-bold text-adult-teal">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-adult-navy">{c.name}</h3>
                    {c.relationship && <p className="text-xs text-adult-navy/50">{c.relationship}</p>}
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-sm text-adult-teal">
                      <Phone className="h-3.5 w-3.5" /> {c.phone}
                    </a>
                  </div>
                  <button
                    onClick={() => deleteContact(c.id)}
                    className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
                    aria-label="Delete contact"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {showAdd ? (
              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
                <h3 className="font-heading font-bold text-adult-navy">Add Trusted Contact</h3>
                {addError && <p className="mt-2 text-sm text-danger">{addError}</p>}
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Name"
                    className="w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                  />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Phone number (e.g. 0821234567)"
                    className="w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                  />
                  <input
                    type="text"
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    placeholder="Relationship (optional, e.g. Sister)"
                    className="w-full rounded-xl border border-adult-sand-dark bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-adult-teal/30"
                  />
                  <div className="flex gap-2">
                    <button onClick={addContact} className="flex-1 rounded-xl bg-adult-teal px-4 py-2.5 text-sm font-bold text-white">Add</button>
                    <button onClick={() => setShowAdd(false)} className="rounded-xl bg-adult-sand px-4 py-2.5 text-sm font-semibold text-adult-navy">Cancel</button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-adult-teal/30 px-6 py-4 text-sm font-semibold text-adult-teal transition-all hover:bg-adult-teal/5"
              >
                <Plus className="h-5 w-5" /> Add Trusted Contact
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
