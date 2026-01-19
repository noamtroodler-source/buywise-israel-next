-- Agent notifications system
CREATE TABLE public.agent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('lead', 'listing', 'system', 'agency')),
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

-- Agents can view their own notifications
CREATE POLICY "Agents can view their own notifications"
ON public.agent_notifications
FOR SELECT
USING (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);

-- Agents can update their own notifications (mark as read)
CREATE POLICY "Agents can update their own notifications"
ON public.agent_notifications
FOR UPDATE
USING (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);

-- System can insert notifications (for triggers)
CREATE POLICY "System can insert notifications"
ON public.agent_notifications
FOR INSERT
WITH CHECK (true);

-- Add onboarding tracking columns to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Create index for faster notification queries
CREATE INDEX idx_agent_notifications_agent_id ON public.agent_notifications(agent_id);
CREATE INDEX idx_agent_notifications_is_read ON public.agent_notifications(is_read);
CREATE INDEX idx_agent_notifications_created_at ON public.agent_notifications(created_at DESC);

-- Function to create notification when new inquiry comes in
CREATE OR REPLACE FUNCTION public.notify_agent_on_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agent_notifications (agent_id, type, title, message, action_url)
  VALUES (
    NEW.agent_id,
    'lead',
    'New Inquiry Received',
    COALESCE(NEW.name, 'Someone') || ' is interested in your listing',
    '/agent/leads'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new inquiries
DROP TRIGGER IF EXISTS on_new_inquiry_notify ON public.property_inquiries;
CREATE TRIGGER on_new_inquiry_notify
  AFTER INSERT ON public.property_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_agent_on_inquiry();