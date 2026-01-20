-- Add notification columns to developers table
ALTER TABLE developers
ADD COLUMN IF NOT EXISTS notify_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_inquiry boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_approval boolean DEFAULT true;

-- Create agency_notifications table
CREATE TABLE IF NOT EXISTS public.agency_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  action_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agency_notifications
CREATE POLICY "Agency members can view their agency notifications"
ON public.agency_notifications
FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM agents WHERE user_id = auth.uid()
    UNION
    SELECT id FROM agencies WHERE admin_user_id = auth.uid()
  )
);

CREATE POLICY "Agency admins can update notifications"
ON public.agency_notifications
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM agencies WHERE admin_user_id = auth.uid()
  )
);

-- Add notification columns to agencies table for settings
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS notify_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_lead boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_join_request boolean DEFAULT true;