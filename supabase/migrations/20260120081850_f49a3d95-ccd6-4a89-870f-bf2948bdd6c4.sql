-- Create table for email verification codes
CREATE TABLE public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agent', 'developer', 'agency')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_email_verifications_email_code ON public.email_verifications(email, code);
CREATE INDEX idx_email_verifications_expires ON public.email_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to manage verifications (service role)
-- No direct user access needed - all access goes through edge functions