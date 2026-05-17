
WITH jre_props AS (
  SELECT id FROM public.properties WHERE primary_agency_id = 'a2c77541-753b-4e17-a368-e454e17ad8d4'
),
jre_jobs AS (
  SELECT id FROM public.import_jobs WHERE agency_id = 'a2c77541-753b-4e17-a368-e454e17ad8d4'
),
d1  AS (DELETE FROM public.favorites WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d2  AS (DELETE FROM public.featured_listings WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d3  AS (DELETE FROM public.featured_performance WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d4  AS (DELETE FROM public.guest_property_saves WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d5  AS (DELETE FROM public.image_hashes WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d6  AS (DELETE FROM public.import_conflicts WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d7  AS (DELETE FROM public.inquiries WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d8  AS (DELETE FROM public.listing_agency_reviews WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d9  AS (DELETE FROM public.listing_claim_requests WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d10 AS (DELETE FROM public.listing_quality_flags WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d11 AS (DELETE FROM public.listing_reports WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d12 AS (DELETE FROM public.location_module_events WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d13 AS (DELETE FROM public.market_insight_cache WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d14 AS (DELETE FROM public.outbound_clicks WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d15 AS (DELETE FROM public.price_context_events WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d16 AS (DELETE FROM public.price_drop_notifications WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d17 AS (DELETE FROM public.primary_agency_history WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d18 AS (DELETE FROM public.primary_disputes WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d19 AS (DELETE FROM public.property_co_agents WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d20 AS (DELETE FROM public.property_inquiries WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d21 AS (DELETE FROM public.property_source_observations WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d22 AS (DELETE FROM public.property_views WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d23 AS (DELETE FROM public.recently_viewed WHERE property_id IN (SELECT id FROM jre_props) RETURNING 1),
d24 AS (DELETE FROM public.import_job_costs WHERE job_id IN (SELECT id FROM jre_jobs) RETURNING 1),
d25 AS (DELETE FROM public.import_job_items WHERE job_id IN (SELECT id FROM jre_jobs) RETURNING 1),
d26 AS (DELETE FROM public.properties WHERE id IN (SELECT id FROM jre_props) RETURNING 1),
d27 AS (DELETE FROM public.import_jobs WHERE id IN (SELECT id FROM jre_jobs) RETURNING 1)
SELECT 'done';
