-- Fix function search path for notify_agent_on_inquiry
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the overly permissive INSERT policy - restrict to system/service role only
DROP POLICY IF EXISTS "System can insert notifications" ON public.agent_notifications;

-- Allow inserts only from authenticated users for their own agent notifications
-- or via trigger (which runs as SECURITY DEFINER)
CREATE POLICY "Authenticated users can receive notifications"
ON public.agent_notifications
FOR INSERT
WITH CHECK (
  agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  )
);