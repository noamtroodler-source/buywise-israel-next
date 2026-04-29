DELETE FROM public.property_co_agents pca
USING public.property_co_agents duplicate
WHERE pca.property_id = duplicate.property_id
  AND pca.agency_id IS NOT DISTINCT FROM duplicate.agency_id
  AND pca.id > duplicate.id;

DELETE FROM public.property_co_agents pca
USING public.properties p
WHERE p.id = pca.property_id
  AND pca.agency_id IS NOT NULL
  AND pca.agency_id = COALESCE(p.primary_agency_id, p.claimed_by_agency_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_property_co_agents_property_agency
ON public.property_co_agents(property_id, agency_id)
WHERE agency_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_primary_agency_as_co_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_primary_agency_id uuid;
BEGIN
  SELECT COALESCE(primary_agency_id, claimed_by_agency_id)
  INTO v_primary_agency_id
  FROM public.properties
  WHERE id = NEW.property_id;

  IF NEW.agency_id IS NOT NULL AND NEW.agency_id = v_primary_agency_id THEN
    RAISE EXCEPTION 'primary_agency_cannot_be_secondary_co_agent';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_primary_agency_as_co_agent ON public.property_co_agents;
CREATE TRIGGER trg_prevent_primary_agency_as_co_agent
BEFORE INSERT OR UPDATE OF property_id, agency_id ON public.property_co_agents
FOR EACH ROW
EXECUTE FUNCTION public.prevent_primary_agency_as_co_agent();