
DELETE FROM import_job_items WHERE job_id IN (SELECT id FROM import_jobs WHERE agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89');
DELETE FROM import_jobs WHERE agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89';
DELETE FROM properties WHERE primary_agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89' OR claimed_by_agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89' OR agent_id IN (SELECT id FROM agents WHERE agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89');
