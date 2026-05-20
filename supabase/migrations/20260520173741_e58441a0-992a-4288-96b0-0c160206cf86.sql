SET session_replication_role = replica;
DELETE FROM public.agency_members WHERE agency_id = 'df8bc627-6330-4fd4-bcec-7c32a35535c2';
SET session_replication_role = DEFAULT;
UPDATE public.agents SET agency_id = NULL WHERE agency_id = 'df8bc627-6330-4fd4-bcec-7c32a35535c2';
DELETE FROM public.agencies WHERE id = 'df8bc627-6330-4fd4-bcec-7c32a35535c2';