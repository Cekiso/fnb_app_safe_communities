/*
# Create Emergency Directory Tables

## Purpose
Phase 1 of the "Safe Communities & GBV Response" app. This migration creates
two public-facing tables that store verified South African emergency contact
numbers and physical support service locations (police stations, shelters,
clinics, Thuthuzela Care Centres, etc.). Both tables are read by the anon-key
frontend (no sign-in required for Phase 1), so RLS policies allow anon +
authenticated SELECT. Writes are restricted to authenticated admins (future
phase) via the service role or a later admin policy.

## Tables

### emergency_contacts
Stores helpline / emergency phone numbers.
- id (uuid PK)
- name (text) — display name, e.g. "GBV Command Centre"
- number (text) — the dial string, e.g. "0800428428"
- alt_number (text, nullable) — secondary number if present
- ussd_code (text, nullable) — USSD string, e.g. "*120*7867#"
- sms_code (text, nullable) — SMS keyword/number, e.g. "help" -> 31531
- description (text) — what this service does
- hours (text) — availability, e.g. "24/7"
- is_free (boolean) — whether the call is free
- category (text) — general | police | medical | gbv | child | mental | trafficking
- languages (text[]) — languages supported
- sort_order (int) — display ordering
- last_verified_at (timestamptz) — when a human last confirmed the number
- created_at, updated_at

### support_services
Stores physical locations of support services.
- id (uuid PK)
- name (text)
- type (text) — shelter | clinic | counselling | police | legal_aid | thuthuzela | social_worker
- address (text, nullable)
- phone (text, nullable)
- description (text, nullable)
- latitude (numeric(9,6))
- longitude (numeric(9,6))
- is_verified (boolean)
- hours (text, nullable)
- languages (text[], nullable)
- created_at, updated_at

## Security
- RLS enabled on both tables.
- SELECT open to anon + authenticated (public directory, no login required).
- INSERT/UPDATE/DELETE restricted to authenticated (future admin role).
- No PII is stored in these tables — they are public directory data.

## Notes
1. Seed data is inserted in a separate migration to keep schema and data clean.
2. All phone numbers are stored as continuous digits for tel: links.
3. last_verified_at is set to now() on seed; must be re-verified before launch.
*/

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  number text NOT NULL,
  alt_number text,
  ussd_code text,
  sms_code text,
  description text NOT NULL DEFAULT '',
  hours text NOT NULL DEFAULT '24/7',
  is_free boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'general',
  languages text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 100,
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_emergency_contacts" ON emergency_contacts;
CREATE POLICY "anon_read_emergency_contacts"
  ON emergency_contacts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_emergency_contacts" ON emergency_contacts;
CREATE POLICY "auth_insert_emergency_contacts"
  ON emergency_contacts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_emergency_contacts" ON emergency_contacts;
CREATE POLICY "auth_update_emergency_contacts"
  ON emergency_contacts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_emergency_contacts" ON emergency_contacts;
CREATE POLICY "auth_delete_emergency_contacts"
  ON emergency_contacts FOR DELETE
  TO authenticated USING (true);

-- Support services table
CREATE TABLE IF NOT EXISTS support_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'police',
  address text,
  phone text,
  description text,
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  hours text,
  languages text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_support_services" ON support_services;
CREATE POLICY "anon_read_support_services"
  ON support_services FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_support_services" ON support_services;
CREATE POLICY "auth_insert_support_services"
  ON support_services FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_support_services" ON support_services;
CREATE POLICY "auth_update_support_services"
  ON support_services FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_support_services" ON support_services;
CREATE POLICY "auth_delete_support_services"
  ON support_services FOR DELETE
  TO authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_category ON emergency_contacts(category);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_sort ON emergency_contacts(sort_order);
CREATE INDEX IF NOT EXISTS idx_support_services_type ON support_services(type);
