-- Phase 4 follow-up: allow import items to be quarantined for duplicate review

ALTER TABLE public.import_job_items
  DROP CONSTRAINT IF EXISTS import_job_items_status_check;

ALTER TABLE public.import_job_items
  ADD CONSTRAINT import_job_items_status_check
  CHECK (status IN ('pending', 'processing', 'done', 'failed', 'skipped', 'co_listed', 'needs_review'));