import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Phone, Shield } from 'lucide-react';
import { QuickExit } from '@/components/QuickExit';
import type { SafePerson } from '@/lib/supabase';

const STORAGE_KEY = 'youth_safe_people';
const EMOJIS = ['🧡', '💙', '💚', '💜', '🧡', '👩', '👨', '👵', '👴', '🧑‍🦰', '👩‍🦱', '👨‍🦱'];

export function YouthSafePeople() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<SafePerson[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emoji, setEmoji] = useState('🧡');
  const [safeWord, setSafeWord] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setPeople(JSON.parse(stored));
  }, []);

  const save = (updated: SafePerson[]) => {
    setPeople(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addPerson = () => {
    if (!name.trim() || !phone.trim()) return;
    const person: SafePerson = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      emoji,
      safeWord: safeWord.trim() || undefined,
    };
    save([...people, person]);
    setName('');
    setPhone('');
    setEmoji('🧡');
    setSafeWord('');
    setShowAdd(false);
  };

  const deletePerson = (id: string) => {
    save(people.filter((p) => p.id !== id));
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
          <h1 className="mt-2 font-heading text-2xl font-bold text-youth-navy">My Safe People</h1>
          <p className="mt-1 font-body text-sm text-youth-navy/60">
            Who is a grown-up you trust? You can add up to 5.
          </p>
        </div>

        <div className="space-y-3">
          {people.length === 0 && !showAdd && (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="font-body text-sm text-youth-navy/60">
                You have no safe people yet. Add a grown-up you trust — like your mom, dad, gran, teacher, or auntie.
              </p>
            </div>
          )}

          {people.map((person) => (
            <div key={person.id} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
              <span className="text-3xl">{person.emoji}</span>
              <div className="flex-1">
                <p className="font-heading font-bold text-youth-navy">{person.name}</p>
                <a href={`tel:${person.phone}`} className="flex items-center gap-1 text-sm text-youth-blue">
                  <Phone className="h-3.5 w-3.5" /> {person.phone}
                </a>
                {person.safeWord && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-youth-lavender">
                    <Shield className="h-3 w-3" /> Safe word: {person.safeWord}
                  </p>
                )}
              </div>
              <button
                onClick={() => deletePerson(person.id)}
                className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
                aria-label="Remove"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {people.length < 5 && showAdd && (
          <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
            <h3 className="font-heading font-bold text-youth-navy">Add a Safe Person</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-youth-navy/60">Choose an emoji</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all ${
                        emoji === e ? 'bg-youth-blue/20 ring-2 ring-youth-blue' : 'bg-youth-cream'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Their name (e.g. Mom)"
                className="w-full rounded-xl border border-youth-lavender/20 bg-youth-cream px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-youth-blue/30"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Their phone number"
                className="w-full rounded-xl border border-youth-lavender/20 bg-youth-cream px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-youth-blue/30"
              />
              <input
                type="text"
                value={safeWord}
                onChange={(e) => setSafeWord(e.target.value)}
                placeholder="Safe word (optional - a secret word for danger)"
                className="w-full rounded-xl border border-youth-lavender/20 bg-youth-cream px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-youth-blue/30"
              />
              <div className="flex gap-2">
                <button onClick={addPerson} className="flex-1 rounded-xl bg-youth-blue px-4 py-2.5 text-sm font-bold text-white">Add</button>
                <button onClick={() => setShowAdd(false)} className="rounded-xl bg-youth-cream px-4 py-2.5 text-sm font-semibold text-youth-navy">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {people.length < 5 && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-youth-blue/30 px-6 py-4 text-sm font-semibold text-youth-blue transition-all hover:bg-youth-blue/5"
          >
            <Plus className="h-5 w-5" /> Add a Safe Person
          </button>
        )}

        <div className="mt-6 rounded-3xl bg-youth-blue/5 p-4 text-center">
          <p className="text-xs leading-relaxed text-youth-navy/60">
            Your safe people are saved ONLY on this device. Nobody else can see them. If you lose your phone, you will need to add them again.
          </p>
        </div>
      </div>
    </div>
  );
}
