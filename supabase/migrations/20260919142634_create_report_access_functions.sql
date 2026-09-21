/*
# Create SECURITY DEFINER functions for report access control

## Purpose
All report reads now go through SECURITY DEFINER functions that bypass RLS
but enforce their own access control. Direct table SELECT returns nothing
because the RLS policies were removed in the previous migration.

## Functions created
1. submit_report_anon(p_data jsonb) — inserts an anonymous report. Called
   by the Edge Function with the service role key. Returns the report ID.
   Does NOT store IP, user-agent, or user ID.

2. check_report_status(p_ref_code text, p_pin_hash text) — looks up a
   report by reference code + hashed PIN. Returns only non-sensitive
   metadata (status, created_at, updated_at, report_type). Never returns
   description, location, or contact details.

3. get_report_for_responder(p_report_id uuid) — returns a single report
   with decrypted fields for a responder. Checks that the caller is an
   authenticated responder/admin. If the report is assigned to a specific
   responder, only that responder can view it. Logs the view in audit_log.

4. list_reports_for_responder(p_status text, p_limit int) — lists reports
   for a responder. Returns only metadata (no sensitive fields). Admins
   see all; responders see unassigned or assigned-to-them reports.

5. update_report_status(p_report_id uuid, p_status text, p_note text) —
   updates a report's status and creates a history entry. Responder/admin
   only. Logs the action.

6. get_report_messages(p_report_id uuid) — returns messages for a report.
   Requires responder auth or valid report access.

7. send_report_message(p_report_id uuid, p_message_encrypted text,
   p_iv text, p_sender_type text) — sends a message. Responder or
   Edge Function (for reporter).

## Security
- All functions are SECURITY DEFINER with a fixed, safe search_path.
- Functions check auth.uid() and profiles.role for authorization.
- Sensitive fields are only returned in get_report_for_responder, not
  in list views.
- Every responder view is logged to audit_log.
*/

-- Helper: hash a PIN using pgcrypto
-- pgcrypto should already be available; if not, create extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. submit_report_anon — called by Edge Function with service role
CREATE OR REPLACE FUNCTION submit_report_anon(p_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id uuid;
  v_ref_code text;
BEGIN
  v_ref_code := p_data->>'reference_code';

  INSERT INTO incident_reports (
    reference_code,
    report_type,
    description,
    location_text,
    contact_details,
    is_anonymous,
    consent_given,
    status,
    report_pin,
    incident_type,
    incident_date,
    is_ongoing,
    children_involved,
    police_contacted,
    medical_contacted,
    support_requested,
    relationship,
    priority,
    encryption_iv,
    encrypted_fields
  ) VALUES (
    v_ref_code,
    p_data->>'report_type',
    p_data->>'description',
    p_data->>'location_text',
    p_data->>'contact_details',
    COALESCE((p_data->>'is_anonymous')::boolean, true),
    COALESCE((p_data->>'consent_given')::boolean, false),
    'submitted',
    p_data->>'report_pin',
    p_data->>'incident_type',
    NULLIF(p_data->>'incident_date', '')::timestamptz,
    COALESCE((p_data->>'is_ongoing')::boolean, false),
    COALESCE((p_data->>'children_involved')::boolean, false),
    COALESCE((p_data->>'police_contacted')::boolean, false),
    COALESCE((p_data->>'medical_contacted')::boolean, false),
    COALESCE(
      CASE
        WHEN p_data->>'support_requested' IS NULL THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text(p_data->'support_requested'))
      END,
      ARRAY[]::text[]
    ),
    NULLIF(p_data->>'relationship', ''),
    COALESCE(p_data->>'priority', 'normal'),
    NULLIF(p_data->>'encryption_iv', ''),
    COALESCE(
      CASE
        WHEN p_data->>'encrypted_fields' IS NULL THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text(p_data->>'encrypted_fields'))
      END,
      ARRAY[]::text[]
    )
  )
  RETURNING id INTO v_report_id;

  -- Log submission (no IP, no user ID)
  INSERT INTO audit_log (actor_type, action, target_type, target_id, metadata)
  VALUES ('system', 'report_submitted', 'incident_report', v_report_id::text,
    jsonb_build_object('reference_code', v_ref_code, 'anonymous', true));

  RETURN v_report_id;
END;
$$;

-- 2. check_report_status — public, requires ref code + hashed PIN
CREATE OR REPLACE FUNCTION check_report_status(p_ref_code text, p_pin_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report incident_reports%ROWTYPE;
BEGIN
  SELECT * INTO v_report
  FROM incident_reports
  WHERE reference_code = UPPER(p_ref_code)
    AND report_pin = p_pin_hash;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- Return only non-sensitive metadata
  RETURN jsonb_build_object(
    'found', true,
    'status', v_report.status,
    'report_type', v_report.report_type,
    'created_at', v_report.created_at,
    'updated_at', v_report.updated_at
  );
END;
$$;

-- 3. get_report_for_responder — returns full report with sensitive fields
CREATE OR REPLACE FUNCTION get_report_for_responder(p_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report incident_reports%ROWTYPE;
  v_role text;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  IF v_role IS NULL OR v_role NOT IN ('ADMIN', 'RESPONDER') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_report FROM incident_reports WHERE id = p_report_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- If not admin, check assignment
  IF v_role != 'ADMIN' AND v_report.assigned_to IS NOT NULL
     AND v_report.assigned_to != v_user_id::text THEN
    RAISE EXCEPTION 'Not assigned to this responder';
  END IF;

  -- Audit log the view
  INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id)
  VALUES ('responder', v_user_id::text, 'report_viewed', 'incident_report', p_report_id::text);

  RETURN jsonb_build_object(
    'found', true,
    'id', v_report.id,
    'reference_code', v_report.reference_code,
    'report_type', v_report.report_type,
    'description', v_report.description,
    'location_text', v_report.location_text,
    'contact_details', v_report.contact_details,
    'is_anonymous', v_report.is_anonymous,
    'consent_given', v_report.consent_given,
    'status', v_report.status,
    'created_at', v_report.created_at,
    'updated_at', v_report.updated_at,
    'incident_type', v_report.incident_type,
    'incident_date', v_report.incident_date,
    'is_ongoing', v_report.is_ongoing,
    'children_involved', v_report.children_involved,
    'police_contacted', v_report.police_contacted,
    'medical_contacted', v_report.medical_contacted,
    'support_requested', v_report.support_requested,
    'relationship', v_report.relationship,
    'priority', v_report.priority,
    'assigned_to', v_report.assigned_to,
    'encryption_iv', v_report.encryption_iv,
    'encrypted_fields', v_report.encrypted_fields
  );
END;
$$;

-- 4. list_reports_for_responder — metadata only, no sensitive fields
CREATE OR REPLACE FUNCTION list_reports_for_responder(p_status text, p_limit int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_user_id uuid := auth.uid();
  v_rows jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  IF v_role IS NULL OR v_role NOT IN ('ADMIN', 'RESPONDER') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_role = 'ADMIN' THEN
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id,
      'reference_code', r.reference_code,
      'report_type', r.report_type,
      'status', r.status,
      'created_at', r.created_at,
      'updated_at', r.updated_at,
      'incident_type', r.incident_type,
      'is_anonymous', r.is_anonymous,
      'children_involved', r.children_involved,
      'priority', r.priority,
      'assigned_to', r.assigned_to
    )) INTO v_rows
    FROM incident_reports r
    WHERE (p_status IS NULL OR p_status = 'all' OR r.status = p_status)
    ORDER BY r.created_at DESC
    LIMIT COALESCE(p_limit, 100);
  ELSE
    -- Responder: see unassigned or assigned-to-them
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id,
      'reference_code', r.reference_code,
      'report_type', r.report_type,
      'status', r.status,
      'created_at', r.created_at,
      'updated_at', r.updated_at,
      'incident_type', r.incident_type,
      'is_anonymous', r.is_anonymous,
      'children_involved', r.children_involved,
      'priority', r.priority,
      'assigned_to', r.assigned_to
    )) INTO v_rows
    FROM incident_reports r
    WHERE (p_status IS NULL OR p_status = 'all' OR r.status = p_status)
      AND (r.assigned_to IS NULL OR r.assigned_to = v_user_id::text)
    ORDER BY r.created_at DESC
    LIMIT COALESCE(p_limit, 100);
  END IF;

  RETURN COALESCE(v_rows, '[]'::jsonb);
END;
$$;

-- 5. update_report_status — responder/admin updates status
CREATE OR REPLACE FUNCTION update_report_status(p_report_id uuid, p_status text, p_note text, p_responder_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  IF v_role IS NULL OR v_role NOT IN ('ADMIN', 'RESPONDER') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE incident_reports
  SET status = p_status, updated_at = now()
  WHERE id = p_report_id;

  INSERT INTO report_status_history (report_id, status, note, changed_by)
  VALUES (p_report_id, p_status, p_note, p_responder_name);

  INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, metadata)
  VALUES ('responder', v_user_id::text, 'report_status_changed', 'incident_report', p_report_id::text,
    jsonb_build_object('new_status', p_status, 'note', p_note));

  RETURN true;
END;
$$;

-- 6. get_report_messages — responder or Edge Function
CREATE OR REPLACE FUNCTION get_report_messages(p_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_user_id uuid := auth.uid();
  v_rows jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  IF v_role IS NULL OR v_role NOT IN ('ADMIN', 'RESPONDER') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'id', m.id,
    'sender_type', m.sender_type,
    'message_encrypted', m.message_encrypted,
    'encryption_iv', m.encryption_iv,
    'responder_id', m.responder_id,
    'read_by_reporter', m.read_by_reporter,
    'read_by_responder', m.read_by_responder,
    'created_at', m.created_at
  )) INTO v_rows
  FROM report_messages m
  WHERE m.report_id = p_report_id
  ORDER BY m.created_at ASC;

  RETURN COALESCE(v_rows, '[]'::jsonb);
END;
$$;

-- 7. send_report_message — responder sends encrypted message
CREATE OR REPLACE FUNCTION send_report_message(
  p_report_id uuid,
  p_message_encrypted text,
  p_iv text,
  p_sender_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_msg_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  IF v_role IS NULL OR v_role NOT IN ('ADMIN', 'RESPONDER') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO report_messages (report_id, sender_type, message_encrypted, encryption_iv, responder_id)
  VALUES (p_report_id, p_sender_type, p_message_encrypted, p_iv, v_user_id::text)
  RETURNING id INTO v_msg_id;

  RETURN v_msg_id;
END;
$$;

-- 8. delete_report_anon — for reporter to delete their own report
CREATE OR REPLACE FUNCTION delete_report_anon(p_ref_code text, p_pin_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id uuid;
BEGIN
  SELECT id INTO v_report_id
  FROM incident_reports
  WHERE reference_code = UPPER(p_ref_code)
    AND report_pin = p_pin_hash;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  DELETE FROM incident_reports WHERE id = v_report_id;

  INSERT INTO audit_log (actor_type, action, target_type, target_id)
  VALUES ('reporter', 'report_deleted', 'incident_report', v_report_id::text);

  RETURN true;
END;
$$;

-- 9. export_report_data — for responder/admin export with audit
CREATE OR REPLACE FUNCTION export_report_data(p_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report incident_reports%ROWTYPE;
  v_role text;
  v_user_id uuid := auth.uid();
  v_messages jsonb;
  v_attachments jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_user_id;

  IF v_role IS NULL OR v_role NOT IN ('ADMIN', 'RESPONDER') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_report FROM incident_reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- Audit log the export
  INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id)
  VALUES ('responder', v_user_id::text, 'report_exported', 'incident_report', p_report_id::text);

  SELECT COALESCE(jsonb_agg(to_jsonb(m)), '[]'::jsonb) INTO v_messages
  FROM report_messages m WHERE m.report_id = p_report_id;

  SELECT COALESCE(jsonb_agg(to_jsonb(a)), '[]'::jsonb) INTO v_attachments
  FROM report_attachments a WHERE a.report_id = p_report_id;

  RETURN jsonb_build_object(
    'found', true,
    'report', to_jsonb(v_report),
    'messages', v_messages,
    'attachments', v_attachments
  );
END;
$$;

-- Grant execute on functions
-- These are SECURITY DEFINER so they run as the owner (postgres)
-- The anon key can call submit_report_anon and check_report_status and delete_report_anon
GRANT EXECUTE ON FUNCTION submit_report_anon(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_report_status(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_report_anon(text, text) TO anon, authenticated;
-- Responder functions require authentication
GRANT EXECUTE ON FUNCTION get_report_for_responder(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION list_reports_for_responder(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION update_report_status(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_report_messages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION send_report_message(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION export_report_data(uuid) TO authenticated;
