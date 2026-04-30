create unique index if not exists properties_unique_source_identity_key
on public.properties (source_identity_key)
where source_identity_key is not null;

create unique index if not exists properties_unique_agency_canonical_source_url
on public.properties (claimed_by_agency_id, canonical_source_url)
where claimed_by_agency_id is not null and canonical_source_url is not null;