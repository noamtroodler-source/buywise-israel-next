-- Migration for Agency System Improvements (Suggestions 1-9)

-- 1. Add label to agency_invites for named invite codes
ALTER TABLE agency_invites ADD COLUMN IF NOT EXISTS label text;

-- 2. Add social links, office address, and office hours to agencies
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS office_address text;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS office_hours text;

-- 3. Add agency tracking columns to property_inquiries for agency-wide leads
ALTER TABLE property_inquiries ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES agencies(id);
ALTER TABLE property_inquiries ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES agents(id);

-- Create function to auto-populate agency_id from agent's agency
CREATE OR REPLACE FUNCTION set_inquiry_agency_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the agency_id from the agent
  SELECT agency_id INTO NEW.agency_id
  FROM agents WHERE id = NEW.agent_id;
  
  -- Default assigned_to to the original agent
  IF NEW.assigned_to IS NULL THEN
    NEW.assigned_to := NEW.agent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-populating agency_id
DROP TRIGGER IF EXISTS trigger_set_inquiry_agency ON property_inquiries;
CREATE TRIGGER trigger_set_inquiry_agency
BEFORE INSERT ON property_inquiries
FOR EACH ROW EXECUTE FUNCTION set_inquiry_agency_id();

-- 4. Create agency_announcements table
CREATE TABLE IF NOT EXISTS agency_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on agency_announcements
ALTER TABLE agency_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_announcements
CREATE POLICY "Agency members can read announcements"
ON agency_announcements FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM agents WHERE user_id = auth.uid()
  ) OR
  agency_id IN (
    SELECT id FROM agencies WHERE admin_user_id = auth.uid()
  )
);

CREATE POLICY "Agency admins can manage announcements"
ON agency_announcements FOR ALL
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE admin_user_id = auth.uid()
  )
);

-- Add RLS policy for agency leads access
CREATE POLICY "Agency admins can view all agency inquiries"
ON property_inquiries FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE admin_user_id = auth.uid()
  )
);

CREATE POLICY "Agency admins can update agency inquiries"
ON property_inquiries FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE admin_user_id = auth.uid()
  )
);

-- Index for faster agency leads queries
CREATE INDEX IF NOT EXISTS idx_property_inquiries_agency_id ON property_inquiries(agency_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_assigned_to ON property_inquiries(assigned_to);