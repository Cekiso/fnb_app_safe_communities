import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppMode } from '@/lib/supabase';

type AppContextValue = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  discreetMode: boolean;
  setDiscreetMode: (value: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
  mascotName: string;
  setMascotName: (value: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(null);
  const [discreetMode, setDiscreetMode] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mascotName, setMascotNameState] = useState('Sizwe');

  useEffect(() => {
    const stored = localStorage.getItem('app_mode') as AppMode | null;
    if (stored) setModeState(stored);
    const discreet = localStorage.getItem('discreet_mode') === 'true';
    if (discreet) setDiscreetMode(true);
    const reduce = localStorage.getItem('reduce_motion') === 'true';
    if (reduce) setReduceMotion(true);
    const mascot = localStorage.getItem('mascot_name');
    if (mascot) setMascotNameState(mascot);
  }, []);

  const setMode = (m: AppMode) => {
    setModeState(m);
    if (m) localStorage.setItem('app_mode', m);
    else localStorage.removeItem('app_mode');
  };

  const setMascotName = (value: string) => {
    setMascotNameState(value);
    localStorage.setItem('mascot_name', value);
  };

  return (
    <AppContext.Provider
      value={{ mode, setMode, discreetMode, setDiscreetMode, reduceMotion, setReduceMotion, mascotName, setMascotName }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
