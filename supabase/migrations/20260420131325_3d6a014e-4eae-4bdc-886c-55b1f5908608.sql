-- ============================================================================
-- Phase 1: White-Glove Agency Onboarding — Database Foundation
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUMS --------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.agency_management_status AS ENUM (
    'draft','provisioning','quality_review','ready_for_handover','handed_over','claimed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.agent_email_strategy AS ENUM ('send_all_now','send_after_owner');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.provisioning_audit_status AS ENUM ('pending','flagged','reviewed','approved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_flag_type AS ENUM (
    'missing_field','low_photo_count','suspicious_value','hebrew_only_description',
    'agent_unassigned','stale_source','address_too_vague_for_geocode'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_flag_severity AS ENUM ('critical','warning','info');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.provisional_credential_role AS ENUM ('owner','agent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.password_setup_purpose AS ENUM ('owner_setup','agent_setup');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- COLUMN ADDITIONS ---------------------------------------------------------

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS management_status public.agency_management_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS provisioned_by UUID,
  ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handover_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agent_email_strategy public.agent_email_strategy NOT NULL DEFAULT 'send_after_owner';

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS is_provisional BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completeness_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS provisioning_audit_status public.provisioning_audit_status,
  ADD COLUMN IF NOT EXISTS quality_audit_score INT,
  ADD COLUMN IF NOT EXISTS provisioned_from_source TEXT;

CREATE INDEX IF NOT EXISTS idx_agencies_management_status ON public.agencies(management_status);
CREATE INDEX IF NOT EXISTS idx_agents_is_provisional ON public.agents(is_provisional) WHERE is_provisional = true;
CREATE INDEX IF NOT EXISTS idx_properties_audit_status ON public.properties(provisioning_audit_status) WHERE provisioning_audit_status IS NOT NULL;

-- TABLE: provisional_credentials -------------------------------------------

CREATE TABLE IF NOT EXISTS public.provisional_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  role public.provisional_credential_role NOT NULL,
  encrypted_password BYTEA NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_at TIMESTAMPTZ,
  revealed_by UUID,
  delivered_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_provisional_credentials_user_id ON public.provisional_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_provisional_credentials_agency_id ON public.provisional_credentials(agency_id);
ALTER TABLE public.provisional_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage provisional credentials" ON public.provisional_credentials;
CREATE POLICY "Admins manage provisional credentials"
  ON public.provisional_credentials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- TABLE: password_setup_tokens ---------------------------------------------

CREATE TABLE IF NOT EXISTS public.password_setup_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  purpose public.password_setup_purpose NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  created_by UUID
);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_user_id ON public.password_setup_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_agency_id ON public.password_setup_tokens(agency_id);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_unused ON public.password_setup_tokens(token) WHERE used_at IS NULL;
ALTER TABLE public.password_setup_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage password setup tokens" ON public.password_setup_tokens;
CREATE POLICY "Admins manage password setup tokens"
  ON public.password_setup_tokens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- TABLE: listing_quality_flags ---------------------------------------------

CREATE TABLE IF NOT EXISTS public.listing_quality_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  flag_type public.listing_flag_type NOT NULL,
  severity public.listing_flag_severity NOT NULL,
  message TEXT,
  auto_resolvable BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listing_quality_flags_property_id ON public.listing_quality_flags(property_id);
CREATE INDEX IF NOT EXISTS idx_listing_quality_flags_unresolved ON public.listing_quality_flags(property_id, severity) WHERE resolved_at IS NULL;
ALTER TABLE public.listing_quality_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage listing quality flags" ON public.listing_quality_flags;
CREATE POLICY "Admins manage listing quality flags"
  ON public.listing_quality_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Agency members can view flags on properties belonging to their agency
-- (joining property → owning agent → agency, OR via primary_agency_id / claimed_by_agency_id)
DROP POLICY IF EXISTS "Agency members view their listing flags" ON public.listing_quality_flags;
CREATE POLICY "Agency members view their listing flags"
  ON public.listing_quality_flags FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      LEFT JOIN public.agents owning_agent ON owning_agent.id = p.agent_id
      JOIN public.agents viewer ON viewer.user_id = auth.uid()
      WHERE p.id = listing_quality_flags.property_id
        AND viewer.agency_id IS NOT NULL
        AND viewer.agency_id IN (
          owning_agent.agency_id,
          p.primary_agency_id,
          p.claimed_by_agency_id
        )
    )
  );

-- TABLE: agency_provisioning_notes -----------------------------------------

CREATE TABLE IF NOT EXISTS public.agency_provisioning_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agency_provisioning_notes_agency_id ON public.agency_provisioning_notes(agency_id);
ALTER TABLE public.agency_provisioning_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage provisioning notes" ON public.agency_provisioning_notes;
CREATE POLICY "Admins manage provisioning notes"
  ON public.agency_provisioning_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- TABLE: agency_provisioning_audit -----------------------------------------

CREATE TABLE IF NOT EXISTS public.agency_provisioning_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  actor_user_id UUID,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_property_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agency_provisioning_audit_agency_id ON public.agency_provisioning_audit(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agency_provisioning_audit_action ON public.agency_provisioning_audit(action);
ALTER TABLE public.agency_provisioning_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read provisioning audit" ON public.agency_provisioning_audit;
CREATE POLICY "Admins read provisioning audit"
  ON public.agency_provisioning_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
-- No INSERT/UPDATE/DELETE policies — append-only via SECURITY DEFINER function.

-- HELPER: log_provisioning_action ------------------------------------------

CREATE OR REPLACE FUNCTION public.log_provisioning_action(
  p_agency_id UUID,
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_property_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required to log provisioning actions';
  END IF;

  INSERT INTO public.agency_provisioning_audit (
    agency_id, actor_user_id, action, target_user_id, target_property_id, metadata
  ) VALUES (
    p_agency_id, auth.uid(), p_action, p_target_user_id, p_target_property_id, COALESCE(p_metadata, '{}'::jsonb)
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_provisioning_action(UUID, TEXT, UUID, UUID, JSONB) TO authenticated;

-- HELPER: consume_password_setup_token -------------------------------------
-- Public: validates a token, marks it used, returns linked user info.
-- Idempotent on already-used (returns was_already_used=true).

CREATE OR REPLACE FUNCTION public.consume_password_setup_token(p_token UUID)
RETURNS TABLE (
  user_id UUID,
  agency_id UUID,
  purpose public.password_setup_purpose,
  was_already_used BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row record;
BEGIN
  SELECT t.user_id, t.agency_id, t.purpose, t.used_at
    INTO v_row
  FROM public.password_setup_tokens t
  WHERE t.token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::public.password_setup_purpose, false;
    RETURN;
  END IF;

  IF v_row.used_at IS NOT NULL THEN
    RETURN QUERY SELECT v_row.user_id, v_row.agency_id, v_row.purpose, true;
    RETURN;
  END IF;

  UPDATE public.password_setup_tokens SET used_at = now() WHERE token = p_token;

  UPDATE public.provisional_credentials
  SET delivered_at = now()
  WHERE user_id = v_row.user_id AND delivered_at IS NULL;

  RETURN QUERY SELECT v_row.user_id, v_row.agency_id, v_row.purpose, false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_password_setup_token(UUID) TO anon, authenticated;