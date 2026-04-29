ALTER TABLE public.lead_response_events
ADD COLUMN IF NOT EXISTS lead_quality_rating integer,
ADD COLUMN IF NOT EXISTS buyer_preparedness text,
ADD COLUMN IF NOT EXISTS lead_quality_reason text,
ADD COLUMN IF NOT EXISTS price_context_complete boolean,
ADD COLUMN IF NOT EXISTS price_context_confidence_tier text,
ADD COLUMN IF NOT EXISTS price_context_badge_status text,
ADD COLUMN IF NOT EXISTS price_context_public_label text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.lead_response_events
DROP CONSTRAINT IF EXISTS lead_response_events_quality_rating_check;

ALTER TABLE public.lead_response_events
ADD CONSTRAINT lead_response_events_quality_rating_check
CHECK (lead_quality_rating IS NULL OR (lead_quality_rating >= 1 AND lead_quality_rating <= 5));

ALTER TABLE public.lead_response_events
DROP CONSTRAINT IF EXISTS lead_response_events_buyer_preparedness_check;

ALTER TABLE public.lead_response_events
ADD CONSTRAINT lead_response_events_buyer_preparedness_check
CHECK (buyer_preparedness IS NULL OR buyer_preparedness IN ('well_prepared', 'some_context', 'unclear', 'unqualified'));

CREATE INDEX IF NOT EXISTS idx_lead_response_events_quality_rating
ON public.lead_response_events(lead_quality_rating)
WHERE lead_quality_rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_response_events_price_context_complete
ON public.lead_response_events(price_context_complete)
WHERE price_context_complete IS NOT NULL;

CREATE OR REPLACE FUNCTION public.update_lead_response_events_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_lead_response_events_updated_at ON public.lead_response_events;
CREATE TRIGGER update_lead_response_events_updated_at
BEFORE UPDATE ON public.lead_response_events
FOR EACH ROW
EXECUTE FUNCTION public.update_lead_response_events_updated_at();