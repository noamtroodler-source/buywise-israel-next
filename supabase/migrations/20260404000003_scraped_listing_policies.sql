-- ============================================================
-- BuyWiseIsrael: Scraped listing visibility policies
-- Auto-publish scraped listings when quality score is set.
-- ============================================================

-- Function: auto-publish a scraped listing when quality score >= 60
CREATE OR REPLACE FUNCTION public.auto_publish_on_quality_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act on scraped listings (have import_source set)
  IF NEW.import_source IS NOT NULL AND NEW.data_quality_score IS NOT NULL THEN
    IF NEW.data_quality_score >= 60 AND OLD.is_published = false THEN
      NEW.is_published := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_publish_scraped_listing
  BEFORE UPDATE OF data_quality_score ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_publish_on_quality_score();

-- Update existing scraped listings: publish those with confidence >= 60
-- (The import pipeline stores confidence_score in import_job_items, not yet
--  in properties.data_quality_score. This backfill handles future imports
--  once the pipeline writes to data_quality_score.)

-- Also: make unclaimed scraped listings visible in queries by ensuring
-- the RLS policy allows reading them publicly
-- (properties already has public read RLS — this is just a comment for clarity)

-- Add index to speed up "find unclaimed sourced listings" queries  
CREATE INDEX IF NOT EXISTS idx_properties_unclaimed_sourced 
  ON public.properties(city, listing_status, price, is_published)
  WHERE import_source IS NOT NULL AND is_claimed = false AND is_published = true;

-- Cron job record for documentation purposes
-- The actual cron is set up in Supabase Dashboard > Cron Jobs:
--   Name: nightly-scrape
--   Schedule: 0 23 * * * (11 PM UTC = 2 AM Israel time)
--   Command: SELECT net.http_post(
--     url := 'https://eveqhyqxdibjayliazxm.supabase.co/functions/v1/nightly-scrape-scheduler',
--     headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );
