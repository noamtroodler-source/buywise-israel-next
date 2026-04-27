UPDATE public.listing_agency_reviews lar
SET status = 'needs_edit',
    review_notes = trim(both from concat_ws(' ', nullif(lar.review_notes, ''), 'Missing street number in address.')),
    reviewed_at = now(),
    updated_at = now()
FROM public.properties p
JOIN public.agencies a ON a.id = p.primary_agency_id
WHERE lar.property_id = p.id
  AND a.name = 'Erez Real Estate'
  AND coalesce(p.address, '') !~ '\d'
  AND lar.status <> 'archived_stale';