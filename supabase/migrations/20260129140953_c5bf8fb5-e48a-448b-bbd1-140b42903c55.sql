
-- Create table to track contact info reveals for scraping prevention
CREATE TABLE public.contact_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL, -- 'agent', 'developer', 'agency'
  entity_id UUID NOT NULL,
  reveal_type TEXT NOT NULL, -- 'phone', 'email'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hint TEXT -- partial IP for rate limit detection (last octet masked)
);

-- Add index for rate limiting queries
CREATE INDEX idx_contact_reveals_session ON public.contact_reveals(session_id, created_at);
CREATE INDEX idx_contact_reveals_entity ON public.contact_reveals(entity_type, entity_id, created_at);

-- Enable RLS
ALTER TABLE public.contact_reveals ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (with session validation)
CREATE POLICY "Insert contact reveals with valid session"
  ON public.contact_reveals FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- Users can view their own reveals
CREATE POLICY "Users can view own reveals"
  ON public.contact_reveals FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all reveals for analytics
CREATE POLICY "Admins can view all reveals"
  ON public.contact_reveals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
