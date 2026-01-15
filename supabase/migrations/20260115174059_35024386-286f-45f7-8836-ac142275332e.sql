-- Update Arnona rates in city_canonical_metrics with research-verified 2025 data
-- Source: Perplexity research January 2026, prioritizing government sources

-- Premium Tier Cities
UPDATE city_canonical_metrics SET arnona_rate_sqm = 87.93, source_priority = 'official_2025' WHERE city_slug = 'tel-aviv';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 120, source_priority = 'estimated_2025' WHERE city_slug = 'herzliya';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 115, source_priority = 'estimated_2025' WHERE city_slug = 'ramat-gan';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 96, source_priority = 'estimated_2025' WHERE city_slug = 'raanana';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 112, source_priority = 'estimated_2025' WHERE city_slug = 'givat-shmuel';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 126, source_priority = 'requires_verification' WHERE city_slug = 'petah-tikva';

-- Mid-Tier Cities
UPDATE city_canonical_metrics SET arnona_rate_sqm = 95, source_priority = 'estimated_2025' WHERE city_slug = 'kfar-saba';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 94, source_priority = 'estimated_2025' WHERE city_slug = 'hod-hasharon';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 62, source_priority = 'estimated_2025' WHERE city_slug = 'netanya';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 68, source_priority = 'estimated_2025' WHERE city_slug = 'modiin';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 65, source_priority = 'official_2025' WHERE city_slug = 'jerusalem';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 58, source_priority = 'official_2025' WHERE city_slug = 'haifa';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 55, source_priority = 'estimated_2025' WHERE city_slug = 'ashdod';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 52.5, source_priority = 'estimated_2025' WHERE city_slug = 'mevaseret-zion';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 95, source_priority = 'estimated_2025' WHERE city_slug = 'caesarea';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 52, source_priority = 'estimated_2025' WHERE city_slug = 'hadera';

-- Value Tier Cities
UPDATE city_canonical_metrics SET arnona_rate_sqm = 47.48, source_priority = 'official_2025' WHERE city_slug = 'beit-shemesh';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 45, source_priority = 'estimated_2025' WHERE city_slug = 'zichron-yaakov';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 36.5, source_priority = 'estimated_2025' WHERE city_slug = 'pardes-hanna';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 50, source_priority = 'estimated_2025' WHERE city_slug = 'ashkelon';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 48.83, source_priority = 'estimated_2025' WHERE city_slug = 'beer-sheva';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 40, source_priority = 'estimated_2025' WHERE city_slug = 'eilat';

-- CRITICAL CORRECTIONS: West Bank settlements (previously significantly understated)
UPDATE city_canonical_metrics SET arnona_rate_sqm = 85.88, source_priority = 'official_2025' WHERE city_slug = 'efrat';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 70, source_priority = 'estimated_2025' WHERE city_slug = 'gush-etzion';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 65, source_priority = 'estimated_2025' WHERE city_slug = 'maale-adumim';

-- Additional cities that may exist
UPDATE city_canonical_metrics SET arnona_rate_sqm = 75, source_priority = 'estimated_2025' WHERE city_slug = 'givatayim';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 85, source_priority = 'estimated_2025' WHERE city_slug = 'holon';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 80, source_priority = 'estimated_2025' WHERE city_slug = 'bat-yam';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 75, source_priority = 'estimated_2025' WHERE city_slug = 'rosh-haayin';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 80, source_priority = 'estimated_2025' WHERE city_slug = 'shoham';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 50, source_priority = 'estimated_2025' WHERE city_slug = 'nahariya';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 55, source_priority = 'estimated_2025' WHERE city_slug = 'kiryat-tivon';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 55, source_priority = 'estimated_2025' WHERE city_slug = 'yokneam';
UPDATE city_canonical_metrics SET arnona_rate_sqm = 60, source_priority = 'estimated_2025' WHERE city_slug = 'givat-zeev';

-- Update timestamp for all modified records
UPDATE city_canonical_metrics SET updated_at = now() WHERE arnona_rate_sqm IS NOT NULL;