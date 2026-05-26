-- Clean leaked HTML fragments (including unclosed <img tags) in already-ingested intel articles
UPDATE public.intel_articles
SET excerpt = NULL
WHERE excerpt ~* '<[a-z]+' OR excerpt ILIKE '%&lt;%' OR excerpt ILIKE '%src=%' OR excerpt ILIKE '%align=%';