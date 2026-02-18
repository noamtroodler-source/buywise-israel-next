
-- A. Partial unique index: prevent double-booking same listing
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_boosts_entity_product_target
ON public.active_boosts (entity_id, product_id, target_id)
WHERE is_active = true;

-- B. Slot cap enforcement function + trigger
CREATE OR REPLACE FUNCTION public.enforce_boost_slot_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_slots int;
  v_current_count int;
BEGIN
  -- Lock on product to serialize concurrent inserts
  PERFORM pg_advisory_xact_lock(hashtext('boost_slot_' || NEW.product_id::text));

  SELECT max_slots INTO v_max_slots
  FROM public.visibility_products
  WHERE id = NEW.product_id;

  IF v_max_slots IS NOT NULL THEN
    SELECT COUNT(*) INTO v_current_count
    FROM public.active_boosts
    WHERE product_id = NEW.product_id
      AND is_active = true
      AND ends_at > now();

    IF v_current_count >= v_max_slots THEN
      RAISE EXCEPTION 'SLOT_FULL: No slots available for this boost product (max: %)', v_max_slots;
    END IF;

    -- Populate slot_position for admin visibility
    NEW.slot_position := v_current_count + 1;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_boost_slot_cap
  BEFORE INSERT ON public.active_boosts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_boost_slot_cap();
