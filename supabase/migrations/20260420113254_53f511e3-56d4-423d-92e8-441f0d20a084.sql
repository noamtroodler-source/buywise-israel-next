-- Ensure pg_net is available for async HTTP from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Replace create_agency_notification to additionally enqueue an email
-- via the send-agency-notification edge function for co-listing events.
CREATE OR REPLACE FUNCTION public.create_agency_notification(
  p_agency_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_action_url text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_supabase_url text := 'https://eveqhyqxdibjayliazxm.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2ZXFoeXF4ZGliamF5bGlhenhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODAwNDMsImV4cCI6MjA4MTg1NjA0M30.Jj193wal4FT9oyYZpHa04VitNjnGb0Nt0eq34XDOJSQ';
BEGIN
  IF p_agency_id IS NULL THEN
    RETURN;
  END IF;

  -- Always insert the in-app notification row (existing behavior, unchanged)
  INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url, is_read)
  VALUES (p_agency_id, p_type, p_title, p_message, p_action_url, false);

  -- For co-listing event types, also fire an async email via pg_net.
  -- The edge function itself checks agency.notify_email and silently no-ops
  -- if the agency has email notifications disabled.
  IF p_type IN (
    'colist_primary_gained',
    'colist_primary_lost',
    'colist_dispute_filed',
    'colist_dispute_resolved',
    'colist_boost_expiring'
  ) THEN
    BEGIN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-agency-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
        ),
        body := jsonb_build_object(
          'type', p_type,
          'agencyId', p_agency_id,
          'title', p_title,
          'message', p_message,
          'actionUrl', p_action_url
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Never let email failures block notification creation
      RAISE WARNING 'send-agency-notification HTTP call failed: %', SQLERRM;
    END;
  END IF;
END;
$function$;