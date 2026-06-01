-- 1. Add RLS policies to tables with RLS enabled but no policies (service-role only access)
CREATE POLICY "Admins can view listing decoder usage" ON public.listing_decoder_usage
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages listing decoder usage" ON public.listing_decoder_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view retention emails log" ON public.retention_emails_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages retention emails log" ON public.retention_emails_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Convert public views to security_invoker so RLS of caller applies
ALTER VIEW public.intel_deep_reads_v SET (security_invoker = true);
ALTER VIEW public.intel_feed_v SET (security_invoker = true);
ALTER VIEW public.intel_pending_deep_reads_v SET (security_invoker = true);
ALTER VIEW public.scraping_cost_by_job SET (security_invoker = true);
ALTER VIEW public.scraping_cost_totals SET (security_invoker = true);
ALTER VIEW public.scraping_cost_total_usd SET (security_invoker = true);
ALTER VIEW public.scraping_cost_by_day SET (security_invoker = true);

-- 3. Set search_path on functions missing it
ALTER FUNCTION public.auto_publish_on_quality_score() SET search_path = public;
ALTER FUNCTION public.claim_listing(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.get_city_price_tiers(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.increment_co_listing_count() SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.run_yad2_enqueue() SET search_path = public;
ALTER FUNCTION public.update_agency_sources_updated_at() SET search_path = public;

-- 4. Drop redundant `Service role ... qual:true` policies — service_role bypasses RLS by default
DROP POLICY IF EXISTS "Service role full access import_jobs" ON public.import_jobs;
DROP POLICY IF EXISTS "Service role full access import_job_items" ON public.import_job_items;
DROP POLICY IF EXISTS "Service role manages guest conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Service role manages all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Service role manages feedback" ON public.chat_feedback;
DROP POLICY IF EXISTS "Service role full access to agency_sources" ON public.agency_sources;
DROP POLICY IF EXISTS "Service role full access to claim requests" ON public.listing_claim_requests;
DROP POLICY IF EXISTS "Service role full access to property_co_agents" ON public.property_co_agents;
DROP POLICY IF EXISTS "Service role" ON public.property_co_agents;
DROP POLICY IF EXISTS "Service role full access to outbound_clicks" ON public.outbound_clicks;
DROP POLICY IF EXISTS "service_role_full_access" ON public.yad2_scrape_queue;