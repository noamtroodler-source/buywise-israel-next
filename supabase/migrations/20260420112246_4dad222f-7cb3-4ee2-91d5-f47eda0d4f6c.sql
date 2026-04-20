-- ============================================================================
-- Phase 7 — Buyer co-listing reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.colisting_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_session_id text,
  property_ids uuid[] NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'confirmed_different_units', 'confirmed_same_unit', 'dismissed')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (array_length(property_ids, 1) >= 2)
);

CREATE INDEX IF NOT EXISTS idx_colisting_reports_status
  ON public.colisting_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_colisting_reports_reporter
  ON public.colisting_reports(reporter_user_id) WHERE reporter_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_colisting_reports_property_ids
  ON public.colisting_reports USING GIN (property_ids);

ALTER TABLE public.colisting_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) may file a report
DROP POLICY IF EXISTS "Anyone can file colisting reports" ON public.colisting_reports;
CREATE POLICY "Anyone can file colisting reports"
ON public.colisting_reports FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Reporters can see their own reports
DROP POLICY IF EXISTS "Reporters view own reports" ON public.colisting_reports;
CREATE POLICY "Reporters view own reports"
ON public.colisting_reports FOR SELECT TO authenticated
USING (reporter_user_id = auth.uid());

-- Admins can view and manage all reports
DROP POLICY IF EXISTS "Admins manage colisting reports" ON public.colisting_reports;
CREATE POLICY "Admins manage colisting reports"
ON public.colisting_reports FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Updated-at trigger
DROP TRIGGER IF EXISTS trg_colisting_reports_updated_at ON public.colisting_reports;
CREATE TRIGGER trg_colisting_reports_updated_at
BEFORE UPDATE ON public.colisting_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- file_colisting_report RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.file_colisting_report(
  p_property_ids uuid[],
  p_reason text,
  p_details text DEFAULT NULL,
  p_session_id text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_user uuid := auth.uid();
BEGIN
  IF p_property_ids IS NULL OR array_length(p_property_ids, 1) < 2 THEN
    RAISE EXCEPTION 'At least two property IDs are required' USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'Reason is required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.colisting_reports (
    reporter_user_id, reporter_session_id, property_ids, reason, details, status
  ) VALUES (
    v_user, p_session_id, p_property_ids, p_reason, p_details, 'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;