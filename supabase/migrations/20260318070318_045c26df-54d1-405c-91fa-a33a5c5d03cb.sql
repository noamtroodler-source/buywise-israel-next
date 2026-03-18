
-- Featured performance tracking table (slim: compute lift on-read)
CREATE TABLE public.featured_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_listing_id uuid NOT NULL UNIQUE REFERENCES public.featured_listings(id) ON DELETE CASCADE,
  property_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  snapshot_views integer NOT NULL DEFAULT 0,
  snapshot_saves integer NOT NULL DEFAULT 0,
  snapshot_inquiries integer NOT NULL DEFAULT 0,
  featured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.featured_performance ENABLE ROW LEVEL SECURITY;

-- Admins can read all
CREATE POLICY "Admins can read all featured_performance"
  ON public.featured_performance FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Agency owners can read their own
CREATE POLICY "Agency members can read own featured_performance"
  ON public.featured_performance FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.user_id = auth.uid() AND a.agency_id = featured_performance.agency_id
    )
  );

-- Trigger: auto-create snapshot on featured_listings INSERT
CREATE OR REPLACE FUNCTION public.snapshot_featured_performance()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $func$
DECLARE
  v_views integer;
  v_saves integer;
  v_inquiries integer;
  v_agency_id uuid;
BEGIN
  -- Get current property stats
  SELECT COALESCE(p.views_count, 0), COALESCE(p.total_saves, 0)
  INTO v_views, v_saves
  FROM public.properties p WHERE p.id = NEW.property_id;

  -- Count current inquiries for this property
  SELECT COUNT(*)::integer INTO v_inquiries
  FROM public.property_inquiries pi WHERE pi.property_id = NEW.property_id;

  v_agency_id := NEW.agency_id;

  INSERT INTO public.featured_performance (
    featured_listing_id, property_id, agency_id,
    snapshot_views, snapshot_saves, snapshot_inquiries, featured_at
  ) VALUES (
    NEW.id, NEW.property_id, v_agency_id,
    COALESCE(v_views, 0), COALESCE(v_saves, 0), COALESCE(v_inquiries, 0), COALESCE(NEW.started_at, now())
  );

  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_snapshot_featured_performance
  AFTER INSERT ON public.featured_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_featured_performance();

-- Backfill existing active featured listings (lift starts from now)
INSERT INTO public.featured_performance (featured_listing_id, property_id, agency_id, snapshot_views, snapshot_saves, snapshot_inquiries, featured_at)
SELECT
  fl.id,
  fl.property_id,
  fl.agency_id,
  COALESCE(p.views_count, 0),
  COALESCE(p.total_saves, 0),
  COALESCE((SELECT COUNT(*) FROM public.property_inquiries pi WHERE pi.property_id = fl.property_id), 0)::integer,
  COALESCE(fl.started_at, fl.created_at)
FROM public.featured_listings fl
JOIN public.properties p ON p.id = fl.property_id
WHERE fl.is_active = true
ON CONFLICT (featured_listing_id) DO NOTHING;
