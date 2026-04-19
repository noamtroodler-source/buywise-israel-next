
-- ═══════════════════════════════════════════════════════════════════
-- PHASE 3: Audit trail, smarter detection, auto-resolution
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add floor_number + apt_number tracking to match_details (jsonb already supports this)
--    Add appeal/undo window column
ALTER TABLE public.cross_agency_conflicts
  ADD COLUMN IF NOT EXISTS auto_resolved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_resolution_reason text,
  ADD COLUMN IF NOT EXISTS appealable_until timestamptz,
  ADD COLUMN IF NOT EXISTS appeal_status text;

CREATE INDEX IF NOT EXISTS idx_cross_agency_conflicts_status
  ON public.cross_agency_conflicts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cross_agency_conflicts_appealable
  ON public.cross_agency_conflicts(appealable_until)
  WHERE appealable_until IS NOT NULL;

-- 2. Audit trail trigger — log every status change (resolution) into admin_audit_log
CREATE OR REPLACE FUNCTION public.log_cross_agency_conflict_resolution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'pending' THEN
    -- Set the 7-day appeal window on first resolution (only for resolutions involving ownership change)
    IF OLD.status = 'pending' AND NEW.status IN ('attempted_agency_confirmed','existing_agency_confirmed') THEN
      NEW.appealable_until := now() + interval '7 days';
      NEW.appeal_status := 'open';
    END IF;

    INSERT INTO public.admin_audit_log (user_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (
      NEW.resolved_by,
      CASE
        WHEN NEW.auto_resolved THEN 'cross_agency_conflict.auto_resolved'
        ELSE 'cross_agency_conflict.resolved'
      END,
      'cross_agency_conflict',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object(
        'status', NEW.status,
        'auto_resolved', NEW.auto_resolved,
        'auto_resolution_reason', NEW.auto_resolution_reason,
        'resolution_notes', NEW.resolution_notes,
        'appealable_until', NEW.appealable_until,
        'attempted_agency_id', NEW.attempted_agency_id,
        'existing_agency_id', NEW.existing_agency_id,
        'existing_property_id', NEW.existing_property_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_cross_agency_conflict_resolution ON public.cross_agency_conflicts;
CREATE TRIGGER trg_log_cross_agency_conflict_resolution
  BEFORE UPDATE ON public.cross_agency_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_cross_agency_conflict_resolution();

-- 3. Undo (appeal) function — re-opens a resolution within 7-day window
CREATE OR REPLACE FUNCTION public.appeal_cross_agency_conflict(
  p_conflict_id uuid,
  p_appealing_agency_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict record;
  v_is_authorized boolean;
BEGIN
  SELECT * INTO v_conflict FROM public.cross_agency_conflicts WHERE id = p_conflict_id;
  IF v_conflict IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conflict not found');
  END IF;

  IF v_conflict.appealable_until IS NULL OR v_conflict.appealable_until < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appeal window has expired (7 days)');
  END IF;

  v_is_authorized := p_appealing_agency_id IN (v_conflict.existing_agency_id, v_conflict.attempted_agency_id);
  IF NOT v_is_authorized THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to appeal this conflict');
  END IF;

  -- Re-open: revert to pending. Audit trail logs this automatically.
  UPDATE public.cross_agency_conflicts
  SET status = 'pending',
      appeal_status = 'appealed',
      resolution_notes = COALESCE(resolution_notes, '') ||
        E'\n[APPEAL ' || to_char(now(), 'YYYY-MM-DD HH24:MI') || '] ' ||
        COALESCE(p_reason, 'No reason provided'),
      resolved_at = NULL,
      resolved_by = NULL
  WHERE id = p_conflict_id;

  -- Reverse the property transfer if applicable
  IF v_conflict.status = 'attempted_agency_confirmed' AND v_conflict.existing_agency_id IS NOT NULL THEN
    UPDATE public.properties
    SET claimed_by_agency_id = v_conflict.existing_agency_id,
        source_url = v_conflict.existing_source_url,
        updated_at = now()
    WHERE id = v_conflict.existing_property_id;
  END IF;

  -- Remove blocklist entries created by this conflict
  DELETE FROM public.agency_source_blocklist WHERE conflict_id = p_conflict_id;

  -- Notify both agencies
  INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url)
  SELECT a, 'cross_agency_conflict_appealed',
    'Conflict resolution appealed',
    'A previously-resolved listing dispute has been re-opened for review.',
    '/agency/conflicts?tab=cross-agency'
  FROM unnest(ARRAY[v_conflict.existing_agency_id, v_conflict.attempted_agency_id]) a
  WHERE a IS NOT NULL;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Smarter detection — extends check_cross_agency_duplicate with floor + apt awareness.
--    If addresses match exactly BUT floor/apt clearly differ, downgrade score to <70 (no conflict).
CREATE OR REPLACE FUNCTION public.check_cross_agency_duplicate_v2(
  p_attempted_agency_id uuid,
  p_address text,
  p_city text,
  p_neighborhood text,
  p_size_sqm numeric,
  p_bedrooms integer,
  p_price numeric,
  p_latitude numeric,
  p_longitude numeric,
  p_floor_number integer DEFAULT NULL,
  p_apartment_number text DEFAULT NULL
)
RETURNS TABLE(
  property_id uuid,
  existing_agency_id uuid,
  existing_source_url text,
  similarity_score integer,
  same_building_different_unit boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_address text;
BEGIN
  IF p_address IS NULL OR p_city IS NULL THEN
    RETURN;
  END IF;

  v_norm_address := lower(regexp_replace(p_address, '[,.\-/\\''"]', ' ', 'g'));
  v_norm_address := lower(regexp_replace(v_norm_address, '\s+', ' ', 'g'));
  v_norm_address := trim(v_norm_address);

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id,
      p.agency_id,
      p.source_url,
      p.floor_number,
      p.apartment_number,
      (
        CASE
          WHEN lower(regexp_replace(COALESCE(p.address, ''), '[,.\-/\\''"]', ' ', 'g')) = v_norm_address THEN 40
          WHEN p.address IS NOT NULL AND (
            position(v_norm_address IN lower(p.address)) > 0
            OR position(lower(p.address) IN v_norm_address) > 0
          ) THEN 25
          ELSE 0
        END
        + CASE
          WHEN p_latitude IS NOT NULL AND p.latitude IS NOT NULL
            AND abs(p.latitude - p_latitude) < 0.0002
            AND abs(p.longitude - p_longitude) < 0.0002 THEN 30
          WHEN p_latitude IS NOT NULL AND p.latitude IS NOT NULL
            AND abs(p.latitude - p_latitude) < 0.0005
            AND abs(p.longitude - p_longitude) < 0.0005 THEN 15
          ELSE 0
        END
        + CASE
          WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL
            AND abs(p.size_sqm - p_size_sqm) <= 5 THEN 15
          WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL
            AND abs(p.size_sqm - p_size_sqm) <= 10 THEN 8
          ELSE 0
        END
        + CASE
          WHEN p_bedrooms IS NOT NULL AND p.bedrooms IS NOT NULL
            AND p.bedrooms = p_bedrooms THEN 10
          ELSE 0
        END
        + CASE
          WHEN p_price IS NOT NULL AND p.price IS NOT NULL AND p.price > 0
            AND abs(p.price - p_price) / GREATEST(p.price, p_price) <= 0.05 THEN 5
          ELSE 0
        END
      )::integer AS raw_score
    FROM public.properties p
    WHERE p.is_published = true
      AND p.agency_id IS NOT NULL
      AND p.agency_id != p_attempted_agency_id
      AND lower(p.city) = lower(p_city)
      AND (p_neighborhood IS NULL OR p.neighborhood IS NULL OR lower(p.neighborhood) = lower(p_neighborhood))
      AND (
        p_latitude IS NULL OR p.latitude IS NULL
        OR (abs(p.latitude - p_latitude) < 0.005 AND abs(p.longitude - p_longitude) < 0.005)
      )
  )
  SELECT
    b.id,
    b.agency_id,
    b.source_url,
    -- If clearly different unit (floor OR apt mismatch with both sides known),
    -- cap score below 70 so it won't trigger a conflict.
    CASE
      WHEN (p_floor_number IS NOT NULL AND b.floor_number IS NOT NULL AND p_floor_number != b.floor_number)
        OR (p_apartment_number IS NOT NULL AND b.apartment_number IS NOT NULL
            AND lower(trim(p_apartment_number)) != lower(trim(b.apartment_number)))
      THEN LEAST(b.raw_score, 50)
      ELSE b.raw_score
    END AS similarity_score,
    (
      (p_floor_number IS NOT NULL AND b.floor_number IS NOT NULL AND p_floor_number != b.floor_number)
      OR (p_apartment_number IS NOT NULL AND b.apartment_number IS NOT NULL
          AND lower(trim(p_apartment_number)) != lower(trim(b.apartment_number)))
    ) AS same_building_different_unit
  FROM base b
  ORDER BY raw_score DESC
  LIMIT 1;
END;
$$;

-- 5. Auto-resolution helper — detect "same source URL" co-listings and auto-resolve them
CREATE OR REPLACE FUNCTION public.auto_resolve_obvious_conflict(p_conflict_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict record;
  v_existing_norm text;
  v_attempted_norm text;
BEGIN
  SELECT * INTO v_conflict FROM public.cross_agency_conflicts
  WHERE id = p_conflict_id AND status = 'pending';
  IF v_conflict IS NULL THEN
    RETURN jsonb_build_object('auto_resolved', false, 'reason', 'not_pending_or_missing');
  END IF;

  v_existing_norm := public.normalize_url(v_conflict.existing_source_url);
  v_attempted_norm := public.normalize_url(v_conflict.attempted_source_url);

  -- Rule 1: same Yad2/Madlan source URL → both agencies are referencing the same
  -- third-party aggregator listing → very likely a co-listing.
  IF v_existing_norm IS NOT NULL
     AND v_existing_norm = v_attempted_norm
     AND (v_existing_norm LIKE '%yad2.co.il%' OR v_existing_norm LIKE '%madlan.co.il%')
  THEN
    UPDATE public.cross_agency_conflicts
    SET status = 'co_listing_confirmed',
        auto_resolved = true,
        auto_resolution_reason = 'identical_aggregator_url',
        resolution_notes = 'Auto-resolved: both agencies reference the same Yad2/Madlan listing — likely a co-listing.',
        resolved_at = now()
    WHERE id = p_conflict_id;
    RETURN jsonb_build_object('auto_resolved', true, 'reason', 'identical_aggregator_url', 'resolution', 'co_listing_confirmed');
  END IF;

  RETURN jsonb_build_object('auto_resolved', false, 'reason', 'no_rule_matched');
END;
$$;
