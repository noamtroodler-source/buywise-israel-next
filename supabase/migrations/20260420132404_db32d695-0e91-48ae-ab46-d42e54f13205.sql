-- Phase 4 support: store AI-suggested field values (not auto-applied)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS ai_suggestions JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_audit_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_properties_last_audit_at ON public.properties(last_audit_at) WHERE last_audit_at IS NOT NULL;