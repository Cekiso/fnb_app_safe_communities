import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type EmergencyContact = {
  id: string;
  name: string;
  number: string;
  alt_number: string | null;
  ussd_code: string | null;
  sms_code: string | null;
  description: string;
  hours: string;
  is_free: boolean;
  category: string;
  languages: string[];
  sort_order: number;
  last_verified_at: string;
};

export type SupportService = {
  id: string;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  is_verified: boolean;
  hours: string | null;
  languages: string[];
};

export type LearningStep = {
  emoji: string;
  text: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer_index: number;
};

export type LearningContent = {
  id: string;
  age_band: string;
  title: string;
  description: string;
  steps: LearningStep[];
  quiz: QuizQuestion[];
  category: string;
  badge_emoji: string;
  sort_order: number;
};

export type IncidentReport = {
  id: string;
  reference_code: string;
  report_type: string;
  description: string;
  location_text: string | null;
  contact_details: string | null;
  is_anonymous: boolean;
  consent_given: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  report_pin?: string | null;
  incident_type?: string | null;
  incident_date?: string | null;
  is_ongoing?: boolean;
  children_involved?: boolean;
  police_contacted?: boolean;
  medical_contacted?: boolean;
  support_requested?: string[];
  relationship?: string | null;
  priority?: string;
  assigned_to?: string | null;
  is_draft?: boolean;
};

export type LocationShareSession = {
  id: string;
  token_hash: string;
  sender_nickname: string;
  sender_phone: string | null;
  status: string;
  started_at: string;
  expires_at: string | null;
  stopped_at: string | null;
  created_at: string;
};

export type LocationPoint = {
  id: string;
  session_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery: number | null;
  recorded_at: string;
};

export type TrustedContact = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  role: string;
  display_name: string;
  created_at: string;
};

export type AppMode = 'adult' | 'youth' | null;

export type UserRole = 'ADULT_USER' | 'RESPONDER' | 'ADMIN';

// Youth safe person stored on device only
export type SafePerson = {
  id: string;
  name: string;
  emoji: string;
  phone: string;
  safeWord?: string;
};
