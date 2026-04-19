
-- 1. Stop the scrapers (cron + flags)
SELECT cron.unschedule('nightly-agency-sync');
SELECT cron.unschedule('yad2-retry-runner');
SELECT cron.unschedule('weekly-scrape');

UPDATE public.agencies
SET auto_sync_enabled = false, auto_sync_url = NULL
WHERE auto_sync_enabled = true;

-- 2. Wipe scraping infrastructure FIRST (clears FKs to agencies)
DELETE FROM public.yad2_scrape_queue;
DELETE FROM public.agency_sources;
DELETE FROM public.import_jobs;
DELETE FROM public.listing_claim_requests;

-- 3. Identify what to delete
CREATE TEMP TABLE _partners (id uuid) ON COMMIT DROP;
INSERT INTO _partners VALUES
  ('5f9ca0e3-6a55-4a07-acc2-6593a22c6537'), -- Jerusalem Real Estate
  ('9361592e-c7b8-49a6-9a21-8349b5c40719'), -- City Zen
  ('cf4682bd-8ade-48a9-928e-e6770f592334'); -- Erez Real Estate

CREATE TEMP TABLE _agencies_del (id uuid) ON COMMIT DROP;
INSERT INTO _agencies_del
SELECT id FROM public.agencies WHERE id NOT IN (SELECT id FROM _partners);

CREATE TEMP TABLE _agents_del (id uuid) ON COMMIT DROP;
INSERT INTO _agents_del
SELECT id FROM public.agents
WHERE agency_id IN (SELECT id FROM _agencies_del) OR agency_id IS NULL;

CREATE TEMP TABLE _props_del (id uuid) ON COMMIT DROP;
INSERT INTO _props_del
SELECT id FROM public.properties
WHERE agent_id IN (SELECT id FROM _agents_del)
   OR import_source IN ('madlan', 'yad2', 'website_scrape');

-- 4. Delete property children
DELETE FROM public.property_inquiries WHERE property_id IN (SELECT id FROM _props_del);
DELETE FROM public.inquiries WHERE property_id IN (SELECT id FROM _props_del);
DELETE FROM public.favorites WHERE property_id IN (SELECT id FROM _props_del);
DELETE FROM public.listing_lifecycle WHERE entity_type = 'property' AND entity_id IN (SELECT id FROM _props_del);
DELETE FROM public.listing_price_history WHERE entity_type = 'property' AND entity_id IN (SELECT id FROM _props_del);
DELETE FROM public.listing_status_history WHERE entity_type = 'property' AND entity_id IN (SELECT id FROM _props_del);
DELETE FROM public.listing_reports WHERE property_id IN (SELECT id FROM _props_del);

-- 5. Delete properties
DELETE FROM public.properties WHERE id IN (SELECT id FROM _props_del);

-- 6. Delete agents + notifications
DELETE FROM public.agent_notifications WHERE agent_id IN (SELECT id FROM _agents_del);
DELETE FROM public.agency_join_requests WHERE agent_id IN (SELECT id FROM _agents_del);
DELETE FROM public.agents WHERE id IN (SELECT id FROM _agents_del);

-- 7. Delete agency-scoped data
DELETE FROM public.agency_notifications WHERE agency_id IN (SELECT id FROM _agencies_del);
DELETE FROM public.agency_invites WHERE agency_id IN (SELECT id FROM _agencies_del);
DELETE FROM public.agency_announcements WHERE agency_id IN (SELECT id FROM _agencies_del);
DELETE FROM public.agency_testimonials WHERE agency_id IN (SELECT id FROM _agencies_del);
DELETE FROM public.agency_join_requests WHERE agency_id IN (SELECT id FROM _agencies_del);

-- 8. Finally delete agencies
DELETE FROM public.agencies WHERE id IN (SELECT id FROM _agencies_del);
