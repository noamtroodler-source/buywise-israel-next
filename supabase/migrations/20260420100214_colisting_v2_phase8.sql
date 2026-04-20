-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Listing v2 — Phase 8: In-app notifications for primary transitions
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Writes rows into public.agency_notifications (existing table, surfaced via
-- the AgencyNotificationBell UI) so agencies learn about:
--   - primary transitions affecting them (promotion, demotion, boost, etc.)
--   - disputes filed against them or involving them
--   - dispute resolutions
--   - boosts about to expire / expired
--
-- Email delivery is intentionally out of scope here — the in-app channel is
-- enough to close the "agency found out a week later" visibility gap. Email
-- can layer on later without changing this schema.

-- ───────────────────────────────────────────────────────────────────────────
-- 1. notify_primary_transition — trigger on primary_agency_history INSERT
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_primary_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_title TEXT;
  v_property_address TEXT;
  v_action_url TEXT;
  v_new_agency_name TEXT;
  v_prev_agency_name TEXT;
  v_promote_title TEXT;
  v_promote_msg TEXT;
  v_demote_title TEXT;
  v_demote_msg TEXT;
BEGIN
  -- Skip the noisy cases — first_import when both sides are NULL, and
  -- the full-table backfill from Phase 1.
  IF NEW.reason = 'legacy_migration' THEN
    RETURN NEW;
  END IF;
  IF NEW.reason = 'first_import' AND NEW.previous_agency_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Load property + agency names (best-effort, tolerate deletes)
  SELECT COALESCE(title, address, 'A property'), address
  INTO v_property_title, v_property_address
  FROM public.properties WHERE id = NEW.property_id;

  SELECT name INTO v_new_agency_name
  FROM public.agencies WHERE id = NEW.new_agency_id;

  IF NEW.previous_agency_id IS NOT NULL THEN
    SELECT name INTO v_prev_agency_name
    FROM public.agencies WHERE id = NEW.previous_agency_id;
  END IF;

  v_action_url := '/property/' || NEW.property_id::text;

  -- ── Promotion notification (for the new primary) ───────────────────────
  CASE NEW.reason
    WHEN 'manual_upgrade' THEN
      v_promote_title := 'You''re now primary on this listing';
      v_promote_msg := 'Your manual submission promoted you above the existing scrape on ' || v_property_title || '.';
    WHEN 'boost_start' THEN
      v_promote_title := 'Boost active — you''re primary for 30 days';
      v_promote_msg := 'Your featured boost on ' || v_property_title || ' has put you in the primary slot. Leads default to you during the boost.';
    WHEN 'boost_end' THEN
      v_promote_title := 'Primary restored';
      v_promote_msg := 'The boost on ' || v_property_title || ' has ended and primary is back with you.';
    WHEN 'admin_override' THEN
      v_promote_title := 'Admin reassigned primary to you';
      v_promote_msg := 'An admin has made your agency the primary on ' || v_property_title || '. ' || COALESCE(NEW.notes, '');
    WHEN 'dispute_resolution' THEN
      v_promote_title := 'Dispute upheld — primary transferred to you';
      v_promote_msg := 'Your dispute was upheld. You''re now primary on ' || v_property_title || '.';
    WHEN 'agency_churn' THEN
      v_promote_title := 'Primary transferred to you';
      v_promote_msg := 'The previous primary agency is no longer active. You''ve been promoted on ' || v_property_title || '.';
    WHEN 'stale_demotion' THEN
      v_promote_title := 'Primary transferred to you';
      v_promote_msg := 'The previous primary''s scrape went stale. You''ve been promoted on ' || v_property_title || '.';
    ELSE
      v_promote_title := NULL;
  END CASE;

  IF v_promote_title IS NOT NULL THEN
    INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url)
    VALUES (NEW.new_agency_id, 'primary_promoted', v_promote_title, v_promote_msg, v_action_url);
  END IF;

  -- ── Demotion notification (for the previous primary, if any) ───────────
  IF NEW.previous_agency_id IS NOT NULL AND NEW.previous_agency_id <> NEW.new_agency_id THEN
    CASE NEW.reason
      WHEN 'manual_upgrade' THEN
        v_demote_title := 'Another agency claimed primary';
        v_demote_msg := COALESCE(v_new_agency_name, 'Another agency') || ' manually claimed primary on ' || v_property_title || '. You''re now shown as "also listed by".';
      WHEN 'boost_start' THEN
        v_demote_title := 'Temporarily co-listed due to a boost';
        v_demote_msg := COALESCE(v_new_agency_name, 'Another agency') || ' has activated a featured boost on ' || v_property_title || '. You''re shown as "also listed by" for 30 days — primary will return to you when the boost ends.';
      WHEN 'admin_override' THEN
        v_demote_title := 'Admin reassigned primary';
        v_demote_msg := 'An admin reassigned primary on ' || v_property_title || ' to ' || COALESCE(v_new_agency_name, 'another agency') || '. ' || COALESCE(NEW.notes, '');
      WHEN 'dispute_resolution' THEN
        v_demote_title := 'Dispute resolved — primary reassigned';
        v_demote_msg := 'A dispute against your primary status on ' || v_property_title || ' was upheld. You''re now shown as "also listed by".';
      WHEN 'stale_demotion' THEN
        v_demote_title := 'Stale scrape — primary reassigned';
        v_demote_msg := 'Your scrape hadn''t refreshed in 60 days, so primary on ' || v_property_title || ' was reassigned to the most-recent co-listed agency.';
      WHEN 'agency_churn' THEN
        v_demote_title := NULL; -- churn = agency gone; no notification
      ELSE
        v_demote_title := NULL;
    END CASE;

    IF v_demote_title IS NOT NULL THEN
      INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url)
      VALUES (NEW.previous_agency_id, 'primary_demoted', v_demote_title, v_demote_msg, v_action_url);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_primary_agency_history_insert ON public.primary_agency_history;
CREATE TRIGGER on_primary_agency_history_insert
  AFTER INSERT ON public.primary_agency_history
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_primary_transition();

-- ───────────────────────────────────────────────────────────────────────────
-- 2. notify_primary_dispute — trigger on primary_disputes INSERT/UPDATE
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_primary_dispute()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_title TEXT;
  v_action_url TEXT;
  v_target_name TEXT;
  v_disputing_name TEXT;
BEGIN
  SELECT COALESCE(title, address, 'A property') INTO v_property_title
  FROM public.properties WHERE id = NEW.property_id;

  SELECT name INTO v_target_name FROM public.agencies WHERE id = NEW.target_agency_id;
  SELECT name INTO v_disputing_name FROM public.agencies WHERE id = NEW.disputing_agency_id;

  v_action_url := '/admin/primary-disputes';

  -- ── INSERT: notify both parties that a dispute was filed ───────────────
  IF TG_OP = 'INSERT' THEN
    -- Disputing agency — acknowledgement
    INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url)
    VALUES (
      NEW.disputing_agency_id,
      'dispute_filed',
      'Dispute filed',
      'Your dispute against ' || COALESCE(v_target_name, 'another agency') || ' on ' || v_property_title || ' is under admin review. Your listing is live as co-listed in the meantime.',
      '/agency/listings'
    );

    -- Target agency — heads up
    INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url)
    VALUES (
      NEW.target_agency_id,
      'dispute_against_you',
      'Primary status disputed',
      COALESCE(v_disputing_name, 'Another agency') || ' filed a dispute claiming primary status on ' || v_property_title || '. An admin will review; no change yet.',
      '/agency/listings'
    );

    RETURN NEW;
  END IF;

  -- ── UPDATE: notify disputing agency of the resolution ───────────────────
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status <> 'pending' THEN
    IF NEW.status = 'resolved_uphold' THEN
      INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url)
      VALUES (
        NEW.disputing_agency_id,
        'dispute_resolved',
        'Dispute upheld',
        'An admin upheld your dispute on ' || v_property_title || '. You''re now primary on this listing.',
        '/property/' || NEW.property_id::text
      );
    ELSIF NEW.status = 'resolved_dismiss' THEN
      INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url)
      VALUES (
        NEW.disputing_agency_id,
        'dispute_resolved',
        'Dispute dismissed',
        'An admin dismissed your dispute on ' || v_property_title || '. ' || COALESCE(NEW.admin_notes, 'No change to primary status.'),
        '/property/' || NEW.property_id::text
      );
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_primary_disputes_change ON public.primary_disputes;
CREATE TRIGGER on_primary_disputes_change
  AFTER INSERT OR UPDATE ON public.primary_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_primary_dispute();

-- ───────────────────────────────────────────────────────────────────────────
-- 3. colisting_boost_warning_sweep — daily "boost expiring tomorrow"
-- ───────────────────────────────────────────────────────────────────────────
--
-- Runs nightly. For boosts expiring in the next 24-48h that haven't yet
-- received a warning notification, inserts one. De-duplicated by scanning
-- recent notifications for the same agency+property+type so re-runs don't
-- double-notify.

CREATE OR REPLACE FUNCTION public.colisting_boost_warning_sweep()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  r RECORD;
  v_property_title TEXT;
  v_action_url TEXT;
BEGIN
  FOR r IN
    SELECT p.id AS property_id, p.boosted_by_agency_id, p.boost_active_until,
           COALESCE(p.title, p.address, 'A property') AS title
    FROM public.properties p
    WHERE p.boosted_by_agency_id IS NOT NULL
      AND p.boost_active_until IS NOT NULL
      AND p.boost_active_until BETWEEN now() + interval '1 day'
                                   AND now() + interval '2 days'
  LOOP
    -- De-dupe: skip if we've warned this agency on this property in the last 5 days
    IF EXISTS (
      SELECT 1 FROM public.agency_notifications
      WHERE agency_id = r.boosted_by_agency_id
        AND type = 'boost_expiring'
        AND action_url = '/property/' || r.property_id::text
        AND created_at > now() - interval '5 days'
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url)
    VALUES (
      r.boosted_by_agency_id,
      'boost_expiring',
      'Boost expires tomorrow',
      'Your featured boost on ' || r.title || ' expires in about 24 hours. Renew from the Featured Listings page to keep the primary slot.',
      '/property/' || r.property_id::text
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Extend end_primary_boost: notify the boosting agency after expiry
-- ───────────────────────────────────────────────────────────────────────────
--
-- Wrap the existing function to also drop a notification when a boost
-- actually ends (whether sweep-expired or manually cancelled). The
-- primary-transition trigger handles the restored-primary notification
-- on its own via the 'boost_end' history row.

CREATE OR REPLACE FUNCTION public.end_primary_boost(
  p_property_id UUID,
  p_agency_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_primary UUID;
  v_boost_holder UUID;
  v_last_reason TEXT;
  v_prev_agency UUID;
  v_prev_agent UUID;
  v_property_title TEXT;
BEGIN
  SELECT primary_agency_id, boosted_by_agency_id, COALESCE(title, address, 'A property')
  INTO v_current_primary, v_boost_holder, v_property_title
  FROM public.properties
  WHERE id = p_property_id;

  IF v_current_primary IS NULL THEN RETURN; END IF;
  IF v_boost_holder IS NULL OR v_boost_holder <> p_agency_id THEN RETURN; END IF;

  SELECT reason, previous_agency_id
  INTO v_last_reason, v_prev_agency
  FROM public.primary_agency_history
  WHERE property_id = p_property_id AND new_agency_id = p_agency_id
  ORDER BY created_at DESC
  LIMIT 1;

  UPDATE public.properties
  SET boost_active_until = NULL,
      boosted_by_agency_id = NULL,
      updated_at = now()
  WHERE id = p_property_id;

  -- Notify the boosting agency that the boost has ended
  INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url)
  VALUES (
    p_agency_id,
    'boost_ended',
    'Boost ended',
    'Your featured boost on ' || v_property_title || ' has ended. Re-feature to claim primary again.',
    '/property/' || p_property_id::text
  );

  IF v_last_reason = 'boost_start' AND v_prev_agency IS NOT NULL AND v_prev_agency <> p_agency_id THEN
    INSERT INTO public.property_co_agents (property_id, agent_id, agency_id, source_url, source_type)
    SELECT p_property_id,
           (SELECT agent_id FROM public.properties WHERE id = p_property_id),
           p_agency_id,
           'buywise:boost-expired:' || p_agency_id::text,
           'website'
    ON CONFLICT (property_id, source_url) DO NOTHING;

    DELETE FROM public.property_co_agents
    WHERE property_id = p_property_id AND agency_id = v_prev_agency;

    SELECT agent_id INTO v_prev_agent
    FROM public.property_co_agents
    WHERE property_id = p_property_id AND agency_id = v_prev_agency
    LIMIT 1;

    PERFORM public.log_primary_transition(
      p_property_id,
      v_prev_agency,
      'boost_end',
      'Featured boost ended; primary restored'
    );

    IF v_prev_agent IS NOT NULL THEN
      UPDATE public.properties SET agent_id = v_prev_agent WHERE id = p_property_id;
    END IF;
  END IF;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- End of Phase 8 migration
-- ───────────────────────────────────────────────────────────────────────────
