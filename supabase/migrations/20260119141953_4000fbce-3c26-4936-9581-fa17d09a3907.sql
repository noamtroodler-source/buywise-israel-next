-- Developer Notifications Table
CREATE TABLE public.developer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('inquiry', 'project_approved', 'project_rejected', 'changes_requested', 'system')),
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.developer_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for developer notifications
CREATE POLICY "Developers can view their own notifications"
  ON public.developer_notifications FOR SELECT
  USING (
    developer_id IN (
      SELECT id FROM public.developers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Developers can update their own notifications"
  ON public.developer_notifications FOR UPDATE
  USING (
    developer_id IN (
      SELECT id FROM public.developers WHERE user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX idx_developer_notifications_developer_id ON public.developer_notifications(developer_id);
CREATE INDEX idx_developer_notifications_is_read ON public.developer_notifications(developer_id, is_read);

-- Add new columns to developers table
ALTER TABLE public.developers 
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS office_city text,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS company_type text,
  ADD COLUMN IF NOT EXISTS specialties text[],
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Add new columns to project_inquiries for lead pipeline
ALTER TABLE public.project_inquiries
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_method text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Function to notify developer on new project inquiry
CREATE OR REPLACE FUNCTION public.notify_developer_on_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.developer_notifications (developer_id, type, title, message, action_url)
  VALUES (
    NEW.developer_id,
    'inquiry',
    'New Project Inquiry',
    COALESCE(NEW.name, 'Someone') || ' is interested in your project',
    '/developer/leads'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new project inquiries
DROP TRIGGER IF EXISTS on_project_inquiry_notify_developer ON public.project_inquiries;
CREATE TRIGGER on_project_inquiry_notify_developer
  AFTER INSERT ON public.project_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_developer_on_inquiry();