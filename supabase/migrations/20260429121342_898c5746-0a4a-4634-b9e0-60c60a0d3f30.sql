-- Phase 7: quarantine uncertain duplicate imports

ALTER TABLE public.import_job_items
  ADD COLUMN IF NOT EXISTS duplicate_review_status text,
  ADD COLUMN IF NOT EXISTS duplicate_review_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_review_recommended_action text,
  ADD COLUMN IF NOT EXISTS duplicate_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS duplicate_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS duplicate_review_notes text;

ALTER TABLE public.import_job_items
  DROP CONSTRAINT IF EXISTS import_job_items_duplicate_review_status_check;

ALTER TABLE public.import_job_items
  ADD CONSTRAINT import_job_items_duplicate_review_status_check
  CHECK (duplicate_review_status IS NULL OR duplicate_review_status IN (
    'pending_review',
    'approved_create_separate',
    'approved_merge_existing',
    'approved_colist_existing',
    'confirmed_same_building_different_unit',
    'dismissed_not_duplicate',
    'needs_more_info'
  ));

ALTER TABLE public.import_job_items
  DROP CONSTRAINT IF EXISTS import_job_items_status_check;

ALTER TABLE public.import_job_items
  ADD CONSTRAINT import_job_items_status_check
  CHECK (status IN ('pending', 'processing', 'done', 'failed', 'skipped', 'co_listed', 'needs_review', 'needs_duplicate_review'));

CREATE INDEX IF NOT EXISTS idx_import_job_items_duplicate_review_queue
  ON public.import_job_items(job_id, duplicate_review_status, created_at DESC)
  WHERE duplicate_review_required = true;

CREATE INDEX IF NOT EXISTS idx_import_job_items_needs_duplicate_review
  ON public.import_job_items(status, duplicate_decision_band, created_at DESC)
  WHERE status = 'needs_duplicate_review';

CREATE OR REPLACE FUNCTION public.quarantine_import_job_item_duplicate_review(
  p_item_id uuid,
  p_matched_property_id uuid,
  p_duplicate_decision text,
  p_duplicate_decision_band text,
  p_duplicate_match_scores jsonb DEFAULT '{}'::jsonb,
  p_duplicate_decision_metadata jsonb DEFAULT '{}'::jsonb,
  p_duplicate_reason_codes text[] DEFAULT ARRAY[]::text[],
  p_recommended_action text DEFAULT 'manual_duplicate_review',
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.import_job_items
  SET status = 'needs_duplicate_review',
      error_type = NULL,
      error_message = coalesce(p_error_message, 'Possible duplicate. Needs review before creation.'),
      matched_property_id = p_matched_property_id,
      duplicate_decision = p_duplicate_decision,
      duplicate_decision_band = p_duplicate_decision_band,
      duplicate_match_scores = coalesce(p_duplicate_match_scores, '{}'::jsonb),
      duplicate_decision_metadata = coalesce(p_duplicate_decision_metadata, '{}'::jsonb) || jsonb_build_object('quarantine_status', 'pending_review'),
      duplicate_reason_codes = public.normalize_duplicate_reason_codes(
        coalesce(p_duplicate_reason_codes, ARRAY[]::text[]) || ARRAY['quarantined_for_duplicate_review'],
        p_duplicate_decision_band,
        coalesce(p_duplicate_match_scores, '{}'::jsonb),
        coalesce(p_duplicate_decision_metadata, '{}'::jsonb) || jsonb_build_object('action', p_recommended_action)
      ),
      duplicate_review_required = true,
      duplicate_review_status = 'pending_review',
      duplicate_review_recommended_action = p_recommended_action
  WHERE id = p_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_import_duplicate_review(
  p_item_id uuid,
  p_resolution text,
  p_reviewed_by uuid DEFAULT auth.uid(),
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.import_job_items%ROWTYPE;
  v_next_status text;
BEGIN
  SELECT * INTO v_item
  FROM public.import_job_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Import job item not found';
  END IF;

  IF p_resolution NOT IN (
    'approved_create_separate',
    'approved_merge_existing',
    'approved_colist_existing',
    'confirmed_same_building_different_unit',
    'dismissed_not_duplicate',
    'needs_more_info'
  ) THEN
    RAISE EXCEPTION 'Invalid duplicate review resolution: %', p_resolution;
  END IF;

  v_next_status := CASE
    WHEN p_resolution IN ('approved_create_separate', 'confirmed_same_building_different_unit', 'dismissed_not_duplicate') THEN 'pending'
    WHEN p_resolution IN ('approved_merge_existing', 'approved_colist_existing') THEN 'co_listed'
    ELSE 'needs_duplicate_review'
  END;

  UPDATE public.import_job_items
  SET status = v_next_status,
      duplicate_review_required = (p_resolution = 'needs_more_info'),
      duplicate_review_status = p_resolution,
      duplicate_reviewed_at = now(),
      duplicate_reviewed_by = p_reviewed_by,
      duplicate_review_notes = p_notes,
      error_message = CASE
        WHEN p_resolution = 'needs_more_info' THEN coalesce(p_notes, error_message)
        WHEN v_next_status = 'pending' THEN NULL
        ELSE error_message
      END,
      error_type = CASE WHEN v_next_status = 'pending' THEN NULL ELSE error_type END,
      duplicate_decision_metadata = coalesce(duplicate_decision_metadata, '{}'::jsonb) || jsonb_build_object(
        'manual_review_resolution', p_resolution,
        'manual_reviewed_at', now(),
        'manual_review_notes', p_notes
      ),
      duplicate_reason_codes = public.normalize_duplicate_reason_codes(
        coalesce(duplicate_reason_codes, ARRAY[]::text[]) || ARRAY['admin_' || p_resolution],
        duplicate_decision_band,
        duplicate_match_scores,
        coalesce(duplicate_decision_metadata, '{}'::jsonb) || jsonb_build_object('action', 'manual_duplicate_review_resolution')
      )
  WHERE id = p_item_id;

  RETURN jsonb_build_object('item_id', p_item_id, 'resolution', p_resolution, 'next_status', v_next_status);
END;
$$;

UPDATE public.import_job_items
SET status = 'needs_duplicate_review',
    duplicate_review_required = true,
    duplicate_review_status = coalesce(duplicate_review_status, 'pending_review'),
    duplicate_review_recommended_action = coalesce(duplicate_review_recommended_action, 'manual_duplicate_review'),
    duplicate_reason_codes = public.normalize_duplicate_reason_codes(
      coalesce(duplicate_reason_codes, ARRAY[]::text[]) || ARRAY['quarantined_for_duplicate_review'],
      duplicate_decision_band,
      duplicate_match_scores,
      coalesce(duplicate_decision_metadata, '{}'::jsonb) || jsonb_build_object('action', 'manual_duplicate_review')
    ),
    duplicate_decision_metadata = coalesce(duplicate_decision_metadata, '{}'::jsonb) || jsonb_build_object('quarantine_status', 'pending_review')
WHERE status = 'needs_review'
  AND duplicate_decision_band IN ('possible_same_unit', 'same_building_insufficient_unit_evidence');