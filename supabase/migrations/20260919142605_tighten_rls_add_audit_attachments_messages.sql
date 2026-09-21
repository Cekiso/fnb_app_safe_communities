/*
# Tighten RLS on incident_reports, add audit/attachment/messaging tables

## Purpose
Step 1 of the secure report backend. This migration:
1. Locks down incident_reports SELECT — removes the open `USING (true)` policy
   and replaces it with a policy that only allows reading via SECURITY DEFINER
   functions (which bypass RLS). Direct table SELECT now returns nothing.
2. Locks down report_status_history similarly.
3. Adds audit_log table for tracking logins, exports, deletions, and responder views.
4. Adds report_attachments table for encrypted file attachments.
5. Adds report_messages table for secure two-way messaging between reporter and responder.
6. Adds report_encryption metadata columns to incident_reports.

## Security changes
- incident_reports: SELECT policy now denies direct access. All reads go through
  SECURITY DEFINER functions (created in a separate migration) that enforce
  per-report access control.
- report_status_history: same pattern.
- New tables all have RLS enabled with appropriate policies.

## Tables added
### audit_log
- id, actor_type (user/responder/admin/system), actor_id (nullable),
  action (text), target_type (text), target_id (nullable), metadata (jsonb),
  ip_hash (nullable — hashed for privacy), created_at

### report_attachments
- id, report_id (fk), filename, content_type, storage_path, encrypted (boolean),
  encryption_iv, uploaded_by (text), created_at

### report_messages
- id, report_id (fk), sender_type (reporter/responder), message_text (encrypted),
  encryption_iv, read_by_reporter (boolean), read_by_responder (boolean),
  responder_id (nullable), created_at

## Columns added to incident_reports
- encryption_iv (text, nullable) — IV used for AES-256-GCM encryption
- encrypted_fields (text[], default '{}') — which fields are encrypted
*/

-- Add encryption metadata to incident_reports
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS encryption_iv text;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS encrypted_fields text[] NOT NULL DEFAULT '{}';

-- Lock down incident_reports: remove open SELECT policy
DROP POLICY IF EXISTS "anon_read_report_by_ref" ON incident_reports;
-- No new SELECT policy — all reads go through SECURITY DEFINER functions

-- Keep INSERT open for anon (the Edge Function uses service role, but keep for now)
-- Actually, remove direct INSERT too — the Edge Function will use service role
DROP POLICY IF EXISTS "anon_insert_reports" ON incident_reports;

-- Remove open UPDATE
DROP POLICY IF EXISTS "auth_update_reports" ON incident_reports;

-- Lock down report_status_history
DROP POLICY IF EXISTS "auth_read_report_history" ON report_status_history;
DROP POLICY IF EXISTS "auth_insert_report_history" ON report_status_history;

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL DEFAULT 'system',
  actor_id text,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- audit_log: only authenticated admins can read; anyone can insert (Edge Function writes)
DROP POLICY IF EXISTS "admin_read_audit_log" ON audit_log;
CREATE POLICY "admin_read_audit_log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "system_insert_audit_log" ON audit_log;
CREATE POLICY "system_insert_audit_log"
  ON audit_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Create report_attachments table
CREATE TABLE IF NOT EXISTS report_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  filename text NOT NULL,
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  storage_path text NOT NULL,
  encrypted boolean NOT NULL DEFAULT true,
  encryption_iv text,
  file_size bigint NOT NULL DEFAULT 0,
  uploaded_by text NOT NULL DEFAULT 'reporter',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE report_attachments ENABLE ROW LEVEL SECURITY;

-- No direct access policies — all through SECURITY DEFINER functions
-- But allow service role (Edge Functions) to operate

-- Create report_messages table
CREATE TABLE IF NOT EXISTS report_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'reporter' CHECK (sender_type IN ('reporter', 'responder')),
  message_encrypted text NOT NULL DEFAULT '',
  encryption_iv text NOT NULL,
  responder_id text,
  read_by_reporter boolean NOT NULL DEFAULT false,
  read_by_responder boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE report_messages ENABLE ROW LEVEL SECURITY;

-- No direct access — all through SECURITY DEFINER functions

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_report_attachments_report ON report_attachments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_messages_report ON report_messages(report_id);
CREATE INDEX IF NOT EXISTS idx_report_messages_created ON report_messages(created_at);
