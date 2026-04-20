-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Listing v2 — Phase 6: Admin tooling RPCs
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Admin-only RPCs that back:
--   - /admin/primary-disputes — uphold or dismiss
--   - /admin/primary-history — manual primary override
--
-- Both require the caller to have the 'admin' role via public.has_role().
--
-- Un-merging (/admin/merge-reversals) is intentionally NOT given an RPC here.
-- The merge_events.loser_snapshot restore has several subtle correctness
-- questions (images, foreign-key cascades, downstream analytics) and should
-- be implemented once we have a real regret case to test against. Until then
-- the admin UI lists merges for visibility only.

-- ───────────────────────────────────────────────────────────────────────────
-- resolve_primary_dispute — admin uphold or dismiss
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.resolve_primary_dispute(
  p_dispute_id UUID,
  p_resolution TEXT,      -- 'resolved_uphold' | 'resolved_dismiss'
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute RECORD;
  v_is_admin BOOLEAN;
BEGIN
  -- AuthZ — only admins can resolve
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF p_resolution NOT IN ('resolved_uphold', 'resolved_dismiss') THEN
    RAISE EXCEPTION 'Invalid resolution: %', p_resolution;
  END IF;

  -- Load dispute
  SELECT id, property_id, disputing_agency_id, target_agency_id, status
  INTO v_dispute
  FROM public.primary_disputes
  WHERE id = p_dispute_id;

  IF v_dispute.id IS NULL THEN
    RAISE EXCEPTION 'Dispute not found: %', p_dispute_id;
  END IF;

  IF v_dispute.status <> 'pending' THEN
    RAISE EXCEPTION 'Dispute already resolved (status: %)', v_dispute.status;
  END IF;

  -- Mark dispute resolved
  UPDATE public.primary_disputes
  SET status = p_resolution,
      resolved_by = auth.uid(),
      resolved_at = now(),
      admin_notes = p_admin_notes
  WHERE id = p_dispute_id;

  -- If upheld: transfer primary to the disputing agency.
  -- The target agency stays co-listed as a secondary (via property_co_agents).
  IF p_resolution = 'resolved_uphold' THEN
    -- Demote current primary to secondary (best-effort)
    INSERT INTO public.property_co_agents (property_id, agent_id, agency_id, source_url, source_type)
    SELECT v_dispute.property_id,
           (SELECT agent_id FROM public.properties WHERE id = v_dispute.property_id),
           v_dispute.target_agency_id,
           'buywise:dispute-demoted:' || v_dispute.target_agency_id::text,
           'website'
    WHERE v_dispute.target_agency_id IS NOT NULL
    ON CONFLICT (property_id, source_url) DO NOTHING;

    -- Remove the disputing agency's co-agent row (they're now primary)
    DELETE FROM public.property_co_agents
    WHERE property_id = v_dispute.property_id
      AND agency_id = v_dispute.disputing_agency_id;

    -- Reassign primary via helper (logs to primary_agency_history)
    PERFORM public.log_primary_transition(
      v_dispute.property_id,
      v_dispute.disputing_agency_id,
      'dispute_resolution',
      COALESCE(p_admin_notes, 'Dispute upheld by admin')
    );
  END IF;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- admin_override_primary — manual primary reassignment
-- ───────────────────────────────────────────────────────────────────────────
--
-- Emergency tool: reassign a property's primary agency to any agency. The
-- current primary is moved into property_co_agents as secondary. Always
-- logged to primary_agency_history with reason='admin_override'.

CREATE OR REPLACE FUNCTION public.admin_override_primary(
  p_property_id UUID,
  p_new_agency_id UUID,
  p_reason_note TEXT DEFAULT NULL
)
RETURNS UUID  -- history row id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_old_primary_agency UUID;
  v_history_id UUID;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT primary_agency_id INTO v_old_primary_agency
  FROM public.properties
  WHERE id = p_property_id;

  IF v_old_primary_agency IS NULL THEN
    RAISE EXCEPTION 'Property not found: %', p_property_id;
  END IF;

  IF v_old_primary_agency = p_new_agency_id THEN
    RAISE EXCEPTION 'Agency is already primary on this property';
  END IF;

  -- Demote old primary into co_agents
  INSERT INTO public.property_co_agents (property_id, agent_id, agency_id, source_url, source_type)
  SELECT p_property_id,
         (SELECT agent_id FROM public.properties WHERE id = p_property_id),
         v_old_primary_agency,
         'buywise:admin-demoted:' || v_old_primary_agency::text,
         'website'
  ON CONFLICT (property_id, source_url) DO NOTHING;

  -- Remove the new primary's co-agent row (if any)
  DELETE FROM public.property_co_agents
  WHERE property_id = p_property_id
    AND agency_id = p_new_agency_id;

  -- Apply + log transition
  v_history_id := public.log_primary_transition(
    p_property_id,
    p_new_agency_id,
    'admin_override',
    COALESCE(p_reason_note, 'Manual admin override')
  );

  RETURN v_history_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- End of Phase 6 migration
-- ───────────────────────────────────────────────────────────────────────────
