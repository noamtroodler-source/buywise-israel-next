-- Database indexes for common property query patterns
-- These will significantly speed up filtering and sorting as data grows

-- Index for listing pages (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_properties_listing_status_published 
ON properties(listing_status, is_published) 
WHERE is_published = true;

-- Index for city filtering (very common)
CREATE INDEX IF NOT EXISTS idx_properties_city_published 
ON properties(city, is_published) 
WHERE is_published = true;

-- Index for price range queries
CREATE INDEX IF NOT EXISTS idx_properties_price_published 
ON properties(price) 
WHERE is_published = true;

-- Index for sorting by newest (default sort)
CREATE INDEX IF NOT EXISTS idx_properties_created_at_published 
ON properties(created_at DESC) 
WHERE is_published = true;

-- Composite index for common filter combo (status + city + price)
CREATE INDEX IF NOT EXISTS idx_properties_status_city_price 
ON properties(listing_status, city, price) 
WHERE is_published = true;

-- Index for featured properties queries
CREATE INDEX IF NOT EXISTS idx_properties_featured_published 
ON properties(is_featured, is_published, created_at DESC) 
WHERE is_published = true AND is_featured = true;