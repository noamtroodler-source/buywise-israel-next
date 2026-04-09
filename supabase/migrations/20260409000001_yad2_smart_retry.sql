-- ============================================================
-- BuyWiseIsrael: Yad2 Smart Retry Queue
-- Replaces single-shot Yad2 scraping with a staggered,
-- retry-aware queue that handles CAPTCHA blocks gracefully.
-- ============================================================

-- 1. Track failure reason on import_jobs (captcha_blocked vs real error)
ALTER TABLE public.import_jobs
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- 2. Yad2 scrape queue — one entry per agency source per ISO week
--    Handles staggered first-run timing + up to 3 CAPTCHA-aware retries
CREATE TABLE IF NOT EXISTS public.yad2_scrape_queue (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_source_id  UUID        NOT NULL REFERENCES public.agency_sources(id) ON DELETE CASCADE,
  agency_id         UUID        REFERENCES public.agencies(id),
  website_url       TEXT        NOT NULL,
  import_type       TEXT        NOT NULL DEFAULT 'resale',

  -- Queue state
  status            TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'done', 'failed', 'exhausted')),
  scheduled_for     TIMESTAMPTZ NOT NULL,
  attempt_number    INTEGER     NOT NULL DEFAULT 1,
  max_attempts      INTEGER     NOT NULL DEFAULT 3,

  -- Result tracking
  last_job_id       UUID        REFERENCES public.import_jobs(id),
  last_result       TEXT,       -- 'success' | 'captcha' | 'error' | 'empty'
  last_error        TEXT,
  listings_found    INTEGER,

  -- Prevent duplicate queuing for the same week
  week_start        DATE        NOT NULL,

  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),

  UNIQUE (agency_source_id, week_start)
);

-- Efficient polling: only pending items due now
CREATE INDEX IF NOT EXISTS idx_yad2_queue_due
  ON public.yad2_scrape_queue (scheduled_for, status)
  WHERE status = 'pending';

-- Cleanup index: find stuck running items
CREATE INDEX IF NOT EXISTS idx_yad2_queue_running
  ON public.yad2_scrape_queue (updated_at, status)
  WHERE status = 'running';

ALTER TABLE public.yad2_scrape_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.yad2_scrape_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Cron jobs — run these manually in Supabase SQL editor:
-- (Replace [SERVICE_ROLE_KEY] with your actual key)
--
-- 1. Reschedule weekly scraper to Friday early morning Israel time:
--    SELECT cron.unschedule('nightly-scrape');
--    SELECT cron.schedule(
--      'weekly-scrape',
--      '0 23 * * 4',   -- Thursday 11 PM UTC = Friday 1-2 AM Israel time
--      $$SELECT net.http_post(
--        url := 'https://eveqhyqxdibjayliazxm.supabase.co/functions/v1/nightly-scrape-scheduler',
--        headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
--        body := '{}'::jsonb
--      )$$
--    );
--
-- 2. Add Yad2 retry runner (every 30 minutes):
--    SELECT cron.schedule(
--      'yad2-retry-runner',
--      '*/30 * * * *',
--      $$SELECT net.http_post(
--        url := 'https://eveqhyqxdibjayliazxm.supabase.co/functions/v1/yad2-retry-runner',
--        headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
--        body := '{}'::jsonb
--      )$$
--    );
-- ============================================================
