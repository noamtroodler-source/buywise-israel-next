-- Add 2 more featured rentals across all 3 systems

-- 1. Homepage slots
INSERT INTO homepage_featured_slots (entity_id, slot_type, position)
VALUES 
  ('6e4d338f-39fb-4773-ab8c-caf3f360292a', 'property_rent', 7),
  ('8ec40282-61b1-4306-9a04-95c83f259bf5', 'property_rent', 8);

-- 2. Featured listings (search boost)
INSERT INTO featured_listings (property_id, agency_id, is_active, is_free_credit)
VALUES
  ('6e4d338f-39fb-4773-ab8c-caf3f360292a', 'cf4682bd-8ade-48a9-928e-e6770f592334', true, true),
  ('8ec40282-61b1-4306-9a04-95c83f259bf5', '9361592e-c7b8-49a6-9a21-8349b5c40719', true, true);

-- 3. is_featured flag
UPDATE properties SET is_featured = true 
WHERE id IN ('6e4d338f-39fb-4773-ab8c-caf3f360292a', '8ec40282-61b1-4306-9a04-95c83f259bf5');