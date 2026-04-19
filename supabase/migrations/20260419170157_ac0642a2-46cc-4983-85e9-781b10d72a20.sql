-- 1. URL normalization helper
CREATE OR REPLACE FUNCTION public.normalize_url(p_url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  v text;
  v_scheme text;
  v_rest text;
  v_path_query text;
  v_path text;
BEGIN
  IF p_url IS NULL OR length(trim(p_url)) = 0 THEN
    RETURN NULL;
  END IF;

  v := trim(p_url);

  -- Lowercase scheme + host. Easiest: lowercase up to first '/' after scheme.
  -- Strip scheme
  IF v ~* '^https?://' THEN
    v_scheme := lower(substring(v from '^(https?)://'));
    v_rest := substring(v from '^https?://(.*)$');
  ELSE
    v_scheme := 'https';
    v_rest := v;
  END IF;

  -- Force https
  v_scheme := 'https';

  -- Split host from path
  IF position('/' in v_rest) > 0 THEN
    v_path_query := substring(v_rest from position('/' in v_rest));
    v_rest := substring(v_rest from 1 for position('/' in v_rest) - 1);
  ELSE
    v_path_query := '/';
  END IF;

  -- Lowercase host, strip leading www.
  v_rest := lower(v_rest);
  IF v_rest LIKE 'www.%' THEN
    v_rest := substring(v_rest from 5);
  END IF;

  -- Strip query string and fragment entirely (tracking params: utm_*, ref, fbclid, gclid, session ids, etc.)
  v_path := v_path_query;
  IF position('?' in v_path) > 0 THEN
    v_path := substring(v_path from 1 for position('?' in v_path) - 1);
  END IF;
  IF position('#' in v_path) > 0 THEN
    v_path := substring(v_path from 1 for position('#' in v_path) - 1);
  END IF;

  -- Strip trailing slash (but keep root '/')
  IF length(v_path) > 1 AND right(v_path, 1) = '/' THEN
    v_path := left(v_path, length(v_path) - 1);
  END IF;

  RETURN v_scheme || '://' || v_rest || v_path;
END;
$$;

-- 2. Update is_url_blocklisted to compare normalized URLs
CREATE OR REPLACE FUNCTION public.is_url_blocklisted(p_agency_id uuid, p_url text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_source_blocklist
    WHERE agency_id = p_agency_id
      AND public.normalize_url(blocked_url) = public.normalize_url(p_url)
  );
$$;

-- 3. Backfill: normalize all existing blocklist entries
UPDATE public.agency_source_blocklist
SET blocked_url = public.normalize_url(blocked_url)
WHERE blocked_url IS DISTINCT FROM public.normalize_url(blocked_url);

-- 4. Index for fast normalized lookups
CREATE INDEX IF NOT EXISTS idx_agency_source_blocklist_norm_url
  ON public.agency_source_blocklist (agency_id, (public.normalize_url(blocked_url)));