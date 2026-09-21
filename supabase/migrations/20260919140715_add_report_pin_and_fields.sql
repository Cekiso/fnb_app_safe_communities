-- Add report_pin column for anonymous status checking, and additional fields for the report wizard
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS report_pin text;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS incident_type text DEFAULT 'gbv';
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS incident_date timestamptz;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS is_ongoing boolean DEFAULT false;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS children_involved boolean DEFAULT false;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS police_contacted boolean DEFAULT false;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS medical_contacted boolean DEFAULT false;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS support_requested text[] DEFAULT '{}';
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS relationship text;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS assigned_to text;
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_priority ON incident_reports(priority);
