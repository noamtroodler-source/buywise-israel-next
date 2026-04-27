UPDATE public.listing_agency_reviews lar
SET status = 'needs_review',
    review_notes = CASE
      WHEN lar.review_notes IS NULL OR btrim(lar.review_notes) = '' THEN 'Missing street number in address — confirm exact street number in the listing wizard.'
      WHEN lar.review_notes ILIKE '%Missing street number in address%' THEN lar.review_notes
      ELSE lar.review_notes || E'\nMissing street number in address — confirm exact street number in the listing wizard.'
    END,
    reviewed_at = now()
FROM public.properties p
WHERE lar.property_id = p.id
  AND lar.status = 'needs_edit'
  AND p.address IS NOT NULL
  AND btrim(p.address) <> ''
  AND p.address !~ '[0-9]'
  AND (
    lar.review_notes IS NULL
    OR lar.review_notes ILIKE '%Missing street number in address%'
  );