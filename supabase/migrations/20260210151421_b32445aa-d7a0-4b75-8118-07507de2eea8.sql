
-- Seed ~150 for_sale properties with price drops (3-8% reduction)
UPDATE properties
SET 
  original_price = price + ROUND(price * (0.03 + RANDOM() * 0.05)),
  price_reduced_at = NOW() - (FLOOR(RANDOM() * 30) || ' days')::interval
WHERE id IN (
  SELECT id FROM properties 
  WHERE listing_status = 'for_sale' 
    AND original_price IS NULL
  ORDER BY RANDOM() 
  LIMIT 150
);

-- Seed ~50 for_rent properties with price drops
UPDATE properties
SET
  original_price = price + ROUND(price * (0.03 + RANDOM() * 0.10)),
  price_reduced_at = NOW() - (FLOOR(RANDOM() * 14) || ' days')::interval
WHERE id IN (
  SELECT id FROM properties 
  WHERE listing_status = 'for_rent' 
    AND original_price IS NULL
  ORDER BY RANDOM() 
  LIMIT 50
);

-- Seed 3 projects with price drops
UPDATE projects
SET
  original_price_from = price_from + ROUND(price_from * (0.03 + RANDOM() * 0.05)),
  price_reduced_at = NOW() - (FLOOR(RANDOM() * 21) || ' days')::interval
WHERE id IN (
  SELECT id FROM projects
  WHERE original_price_from IS NULL
    AND price_from IS NOT NULL
  ORDER BY RANDOM()
  LIMIT 3
);
