
ALTER TABLE public.agency_members DISABLE TRIGGER USER;

DELETE FROM listing_quality_flags WHERE property_id IN (SELECT id FROM properties WHERE primary_agency_id='d3070000-0000-4000-a000-000000000001' OR import_source='demo_onboarding');
DELETE FROM property_inquiries WHERE property_id IN (SELECT id FROM properties WHERE primary_agency_id='d3070000-0000-4000-a000-000000000001' OR import_source='demo_onboarding');
DELETE FROM listing_agency_reviews WHERE property_id IN (SELECT id FROM properties WHERE primary_agency_id='d3070000-0000-4000-a000-000000000001' OR import_source='demo_onboarding');
DELETE FROM property_co_agents WHERE property_id IN (SELECT id FROM properties WHERE primary_agency_id='d3070000-0000-4000-a000-000000000001' OR import_source='demo_onboarding');
DELETE FROM import_job_items WHERE property_id IN (SELECT id FROM properties WHERE primary_agency_id='d3070000-0000-4000-a000-000000000001' OR import_source='demo_onboarding');
DELETE FROM properties WHERE primary_agency_id='d3070000-0000-4000-a000-000000000001' OR import_source='demo_onboarding';
DELETE FROM agents WHERE agency_id='d3070000-0000-4000-a000-000000000001';
DELETE FROM agency_members WHERE agency_id='d3070000-0000-4000-a000-000000000001';
DELETE FROM agencies WHERE id='d3070000-0000-4000-a000-000000000001';

ALTER TABLE public.agency_members ENABLE TRIGGER USER;
