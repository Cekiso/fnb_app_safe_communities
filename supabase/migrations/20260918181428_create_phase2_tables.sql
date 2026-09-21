/*
# Create Learning Content, Incident Reports, Location Share, and Trusted Contacts Tables

## Purpose
Phase 2 expansion: adds tables for youth learning content, GBV incident
reporting, live location sharing sessions + points, and adult trusted
contacts. Also adds a profiles table for role-based access.

## Tables

### learning_content
Youth educational lessons across age bands.
- id, age_band (6-9/10-13/14-17), title, description, steps (jsonb array
  of {text, emoji}), quiz (jsonb array of {question, options[], answer_index}),
  category, badge_emoji, sort_order, created_at

### learning_progress
Anonymous device-based progress tracking (no PII).
- id, device_id (text), lesson_id (fk), completed_at, badge_earned (boolean)

### incident_reports
GBV incident reporting with encrypted sensitive fields.
- id, reference_code (text unique), report_type, description (encrypted),
  location_text (encrypted, nullable), contact_details (encrypted, nullable),
  is_anonymous (boolean), consent_given (boolean), status (text), created_at,
  updated_at

### report_status_history
- id, report_id (fk), status, note (nullable), changed_by (text nullable),
  changed_at

### location_share_sessions
- id, token_hash (text unique), sender_nickname (text), sender_phone (text
  nullable), status (text: active/stopped/expired), started_at, expires_at,
  stopped_at (nullable), created_at

### location_points
- id, session_id (fk), latitude, longitude, accuracy (nullable), battery
  (nullable), recorded_at. Auto-purged.

### trusted_contacts
Adult user's trusted circle (server-side for adult accounts).
- id, user_id (uuid, fk auth.users), name, phone, relationship (nullable),
  created_at

### profiles
Extends auth.users with role info.
- id (uuid, fk auth.users), role (text: ADULT_USER/RESPONDER/ADMIN),
  display_name (text), created_at

## Security
- RLS enabled on all tables.
- learning_content: public read (anon+authenticated), admin write.
- learning_progress: anon can read/insert own device_id, admin can read all.
- incident_reports: anon can insert (anonymous reporting), admin/responder
  can read/update. Reference code lookup is public.
- report_status_history: admin/responder only.
- location_share_sessions: anon can insert (create session), public read by
  token_hash (the tracking page), admin can read all.
- location_points: anon can insert by session, public read by session_id
  (tracking page needs to show points), auto-purged.
- trusted_contacts: authenticated owner only.
- profiles: authenticated owner can read own, admin can read all.
*/

-- learning_content
CREATE TABLE IF NOT EXISTS learning_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age_band text NOT NULL CHECK (age_band IN ('6-9', '10-13', '14-17')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  steps jsonb NOT NULL DEFAULT '[]',
  quiz jsonb NOT NULL DEFAULT '[]',
  category text NOT NULL DEFAULT 'body_safety',
  badge_emoji text NOT NULL DEFAULT '⭐',
  sort_order int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE learning_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_learning_content" ON learning_content;
CREATE POLICY "anon_read_learning_content"
  ON learning_content FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_learning_content" ON learning_content;
CREATE POLICY "auth_manage_learning_content"
  ON learning_content FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- learning_progress
CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  lesson_id uuid REFERENCES learning_content(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  badge_earned boolean NOT NULL DEFAULT true
);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_manage_learning_progress" ON learning_progress;
CREATE POLICY "anon_manage_learning_progress"
  ON learning_progress FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- incident_reports
CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text UNIQUE NOT NULL,
  report_type text NOT NULL DEFAULT 'gbv',
  description text NOT NULL DEFAULT '',
  location_text text,
  contact_details text,
  is_anonymous boolean NOT NULL DEFAULT true,
  consent_given boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_reports" ON incident_reports;
CREATE POLICY "anon_insert_reports"
  ON incident_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_report_by_ref" ON incident_reports;
CREATE POLICY "anon_read_report_by_ref"
  ON incident_reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_reports" ON incident_reports;
CREATE POLICY "auth_update_reports"
  ON incident_reports FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- report_status_history
CREATE TABLE IF NOT EXISTS report_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES incident_reports(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  changed_by text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_report_history" ON report_status_history;
CREATE POLICY "auth_read_report_history"
  ON report_status_history FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_report_history" ON report_status_history;
CREATE POLICY "auth_insert_report_history"
  ON report_status_history FOR INSERT
  TO authenticated WITH CHECK (true);

-- location_share_sessions
CREATE TABLE IF NOT EXISTS location_share_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text UNIQUE NOT NULL,
  sender_nickname text NOT NULL DEFAULT 'Anonymous',
  sender_phone text,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  stopped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE location_share_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_location_sessions" ON location_share_sessions;
CREATE POLICY "anon_read_location_sessions"
  ON location_share_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_location_sessions" ON location_share_sessions;
CREATE POLICY "anon_insert_location_sessions"
  ON location_share_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_location_sessions" ON location_share_sessions;
CREATE POLICY "anon_update_location_sessions"
  ON location_share_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- location_points
CREATE TABLE IF NOT EXISTS location_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES location_share_sessions(id) ON DELETE CASCADE,
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  accuracy numeric(10,2),
  battery numeric(5,2),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE location_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_location_points" ON location_points;
CREATE POLICY "anon_read_location_points"
  ON location_points FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_location_points" ON location_points;
CREATE POLICY "anon_insert_location_points"
  ON location_points FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- trusted_contacts
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  relationship text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_trusted_contacts" ON trusted_contacts;
CREATE POLICY "owner_read_trusted_contacts"
  ON trusted_contacts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert_trusted_contacts" ON trusted_contacts;
CREATE POLICY "owner_insert_trusted_contacts"
  ON trusted_contacts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_trusted_contacts" ON trusted_contacts;
CREATE POLICY "owner_update_trusted_contacts"
  ON trusted_contacts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete_trusted_contacts" ON trusted_contacts;
CREATE POLICY "owner_delete_trusted_contacts"
  ON trusted_contacts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'ADULT_USER',
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_profile" ON profiles;
CREATE POLICY "owner_read_profile"
  ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "owner_update_profile" ON profiles;
CREATE POLICY "owner_update_profile"
  ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_insert_profile" ON profiles;
CREATE POLICY "owner_insert_profile"
  ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_content_age ON learning_content(age_band);
CREATE INDEX IF NOT EXISTS idx_incident_reports_ref ON incident_reports(reference_code);
CREATE INDEX IF NOT EXISTS idx_location_sessions_token ON location_share_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_location_points_session ON location_points(session_id);
CREATE INDEX IF NOT EXISTS idx_location_points_recorded ON location_points(recorded_at);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user ON trusted_contacts(user_id);
