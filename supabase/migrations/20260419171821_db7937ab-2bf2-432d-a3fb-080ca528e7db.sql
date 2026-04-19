-- Track when each agency last received a cross-agency conflict digest email.
-- Used by send-conflict-digest to only include conflicts created since the
-- last digest, so we don't send the same conflicts twice.
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS last_conflict_digest_at TIMESTAMPTZ;

COMMENT ON COLUMN public.agencies.last_conflict_digest_at IS
  'Timestamp of the last cross-agency conflict digest email sent to this agency. Used by send-conflict-digest to dedupe conflicts across runs.';