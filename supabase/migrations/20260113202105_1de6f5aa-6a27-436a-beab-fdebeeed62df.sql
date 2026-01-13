
-- Phase 1: Delete existing market_data for 6 cities
DELETE FROM market_data WHERE city IN (
  'Netanya', 'Hadera', 'Caesarea', 'Haifa', 'Ashdod', 'Modi''in', 'Modiin'
);

-- Phase 2: Insert research price trend series for all 6 cities

-- NETANYA (19 data points from research)
INSERT INTO market_data (city, year, month, average_price_sqm, data_type) VALUES
('Netanya', 2025, 1, 27000, 'monthly'),
('Netanya', 2024, 12, 27200, 'monthly'),
('Netanya', 2024, 6, 28000, 'monthly'),
('Netanya', 2024, 1, 28500, 'monthly'),
('Netanya', 2023, 6, 28800, 'monthly'),
('Netanya', 2023, 1, 29000, 'monthly'),
('Netanya', 2022, 6, 28000, 'monthly'),
('Netanya', 2022, 1, 26500, 'monthly'),
('Netanya', 2021, 6, 24000, 'monthly'),
('Netanya', 2021, 1, 22000, 'monthly'),
('Netanya', 2020, 6, 20000, 'monthly'),
('Netanya', 2020, 1, 18000, 'monthly');

-- HADERA (19 data points from research)
INSERT INTO market_data (city, year, month, average_price_sqm, data_type) VALUES
('Hadera', 2025, 1, 20500, 'monthly'),
('Hadera', 2024, 12, 20800, 'monthly'),
('Hadera', 2024, 6, 21500, 'monthly'),
('Hadera', 2024, 1, 22000, 'monthly'),
('Hadera', 2023, 6, 21800, 'monthly'),
('Hadera', 2023, 1, 21500, 'monthly'),
('Hadera', 2022, 6, 20500, 'monthly'),
('Hadera', 2022, 1, 19000, 'monthly'),
('Hadera', 2021, 6, 17500, 'monthly'),
('Hadera', 2021, 1, 16000, 'monthly'),
('Hadera', 2020, 6, 14500, 'monthly'),
('Hadera', 2020, 1, 13500, 'monthly');

-- CAESAREA (6 data points - annual villa prices from research)
INSERT INTO market_data (city, year, month, average_price_sqm, data_type) VALUES
('Caesarea', 2025, 1, 37500, 'monthly'),
('Caesarea', 2024, 1, 38500, 'monthly'),
('Caesarea', 2023, 1, 40000, 'monthly'),
('Caesarea', 2022, 1, 38000, 'monthly'),
('Caesarea', 2021, 1, 35000, 'monthly'),
('Caesarea', 2020, 1, 32000, 'monthly');

-- HAIFA (21 data points from research)
INSERT INTO market_data (city, year, month, average_price_sqm, data_type) VALUES
('Haifa', 2025, 1, 18500, 'monthly'),
('Haifa', 2024, 12, 18700, 'monthly'),
('Haifa', 2024, 6, 19200, 'monthly'),
('Haifa', 2024, 1, 19800, 'monthly'),
('Haifa', 2023, 6, 20000, 'monthly'),
('Haifa', 2023, 1, 20200, 'monthly'),
('Haifa', 2022, 6, 19500, 'monthly'),
('Haifa', 2022, 1, 18000, 'monthly'),
('Haifa', 2021, 6, 16500, 'monthly'),
('Haifa', 2021, 1, 15000, 'monthly'),
('Haifa', 2020, 6, 14000, 'monthly'),
('Haifa', 2020, 1, 13000, 'monthly');

-- ASHDOD (18 data points from research)
INSERT INTO market_data (city, year, month, average_price_sqm, data_type) VALUES
('Ashdod', 2025, 1, 23000, 'monthly'),
('Ashdod', 2024, 12, 23200, 'monthly'),
('Ashdod', 2024, 6, 23800, 'monthly'),
('Ashdod', 2024, 1, 24200, 'monthly'),
('Ashdod', 2023, 6, 24500, 'monthly'),
('Ashdod', 2023, 1, 24800, 'monthly'),
('Ashdod', 2022, 6, 24000, 'monthly'),
('Ashdod', 2022, 1, 22500, 'monthly'),
('Ashdod', 2021, 6, 20500, 'monthly'),
('Ashdod', 2021, 1, 18500, 'monthly'),
('Ashdod', 2020, 6, 17000, 'monthly'),
('Ashdod', 2020, 1, 16000, 'monthly');

-- MODI'IN (18 data points from research)
INSERT INTO market_data (city, year, month, average_price_sqm, data_type) VALUES
('Modi''in', 2025, 1, 27000, 'monthly'),
('Modi''in', 2024, 12, 27200, 'monthly'),
('Modi''in', 2024, 6, 27800, 'monthly'),
('Modi''in', 2024, 1, 28200, 'monthly'),
('Modi''in', 2023, 6, 28000, 'monthly'),
('Modi''in', 2023, 1, 27500, 'monthly'),
('Modi''in', 2022, 6, 26000, 'monthly'),
('Modi''in', 2022, 1, 24000, 'monthly'),
('Modi''in', 2021, 6, 22000, 'monthly'),
('Modi''in', 2021, 1, 20500, 'monthly'),
('Modi''in', 2020, 6, 19000, 'monthly'),
('Modi''in', 2020, 1, 18000, 'monthly');

-- Phase 3: Delete existing historical_prices for 6 cities
DELETE FROM historical_prices WHERE city IN (
  'Netanya', 'Hadera', 'Caesarea', 'Haifa', 'Ashdod', 'Modi''in', 'Modiin'
);

-- Phase 4: Insert historical_prices derived from research
INSERT INTO historical_prices (city, year, average_price_sqm, yoy_change_percent) VALUES
-- Netanya
('Netanya', 2025, 27000, -6.2),
('Netanya', 2024, 28500, -1.7),
('Netanya', 2023, 29000, 9.4),
('Netanya', 2022, 26500, 20.5),
('Netanya', 2021, 22000, 22.2),
('Netanya', 2020, 18000, NULL),
-- Hadera
('Hadera', 2025, 20500, -6.8),
('Hadera', 2024, 22000, 2.3),
('Hadera', 2023, 21500, 13.2),
('Hadera', 2022, 19000, 18.8),
('Hadera', 2021, 16000, 18.5),
('Hadera', 2020, 13500, NULL),
-- Caesarea
('Caesarea', 2025, 37500, -2.6),
('Caesarea', 2024, 38500, -3.8),
('Caesarea', 2023, 40000, 5.3),
('Caesarea', 2022, 38000, 8.6),
('Caesarea', 2021, 35000, 9.4),
('Caesarea', 2020, 32000, NULL),
-- Haifa
('Haifa', 2025, 18500, -6.6),
('Haifa', 2024, 19800, -2.0),
('Haifa', 2023, 20200, 12.2),
('Haifa', 2022, 18000, 20.0),
('Haifa', 2021, 15000, 15.4),
('Haifa', 2020, 13000, NULL),
-- Ashdod
('Ashdod', 2025, 23000, -5.0),
('Ashdod', 2024, 24200, -2.4),
('Ashdod', 2023, 24800, 10.2),
('Ashdod', 2022, 22500, 21.6),
('Ashdod', 2021, 18500, 15.6),
('Ashdod', 2020, 16000, NULL),
-- Modi'in
('Modi''in', 2025, 27000, -4.3),
('Modi''in', 2024, 28200, 2.5),
('Modi''in', 2023, 27500, 14.6),
('Modi''in', 2022, 24000, 17.1),
('Modi''in', 2021, 20500, 13.9),
('Modi''in', 2020, 18000, NULL);

-- Phase 5: Update city_canonical_metrics with research values
UPDATE city_canonical_metrics SET
  average_price_sqm = 27000,
  median_apartment_price = 2568000,
  yoy_price_change = -6.2,
  gross_yield_percent = 2.8,
  net_yield_percent = 1.8,
  arnona_rate_sqm = 62,
  arnona_monthly_avg = 500,
  rental_3_room_min = 4000,
  rental_3_room_max = 5500,
  rental_4_room_min = 5500,
  rental_4_room_max = 7500,
  rental_5_room_min = 7000,
  rental_5_room_max = 9500,
  data_sources = '{"price_data": "CBS, Madlan, Kantahome 2024-2025", "rental_data": "Yad2, HomeClick surveys", "arnona": "Netanya Municipality 2024-2025"}'::jsonb,
  last_verified = '2025-01-13',
  updated_at = now()
WHERE city_slug = 'netanya';

UPDATE city_canonical_metrics SET
  average_price_sqm = 20500,
  median_apartment_price = 1800000,
  yoy_price_change = -6.8,
  gross_yield_percent = 3.5,
  net_yield_percent = 2.5,
  arnona_rate_sqm = 52,
  arnona_monthly_avg = 420,
  rental_3_room_min = 3500,
  rental_3_room_max = 4500,
  rental_4_room_min = 4500,
  rental_4_room_max = 6000,
  rental_5_room_min = 5500,
  rental_5_room_max = 7500,
  data_sources = '{"price_data": "CBS, Madlan, Kantahome 2024-2025", "rental_data": "Yad2, HomeClick surveys", "arnona": "Hadera Municipality 2024-2025"}'::jsonb,
  last_verified = '2025-01-13',
  updated_at = now()
WHERE city_slug = 'hadera';

UPDATE city_canonical_metrics SET
  average_price_sqm = 37500,
  median_apartment_price = 8500000,
  yoy_price_change = -2.6,
  gross_yield_percent = 2.0,
  net_yield_percent = 1.2,
  arnona_rate_sqm = 95,
  arnona_monthly_avg = 1200,
  rental_3_room_min = 8000,
  rental_3_room_max = 12000,
  rental_4_room_min = 12000,
  rental_4_room_max = 18000,
  rental_5_room_min = 15000,
  rental_5_room_max = 25000,
  data_sources = '{"price_data": "CBS, Madlan, Kantahome 2024-2025", "rental_data": "Yad2 premium listings", "arnona": "Hof HaCarmel Regional Council 2024-2025"}'::jsonb,
  last_verified = '2025-01-13',
  updated_at = now()
WHERE city_slug = 'caesarea';

UPDATE city_canonical_metrics SET
  average_price_sqm = 18500,
  median_apartment_price = 1650000,
  yoy_price_change = -6.6,
  gross_yield_percent = 4.2,
  net_yield_percent = 3.2,
  arnona_rate_sqm = 58,
  arnona_monthly_avg = 465,
  rental_3_room_min = 3200,
  rental_3_room_max = 4200,
  rental_4_room_min = 4200,
  rental_4_room_max = 5500,
  rental_5_room_min = 5000,
  rental_5_room_max = 7000,
  data_sources = '{"price_data": "CBS, Madlan, Kantahome 2024-2025", "rental_data": "Yad2, HomeClick surveys", "arnona": "Haifa Municipality 2024-2025"}'::jsonb,
  last_verified = '2025-01-13',
  updated_at = now()
WHERE city_slug = 'haifa';

UPDATE city_canonical_metrics SET
  average_price_sqm = 23000,
  median_apartment_price = 2100000,
  yoy_price_change = -5.0,
  gross_yield_percent = 3.2,
  net_yield_percent = 2.2,
  arnona_rate_sqm = 55,
  arnona_monthly_avg = 440,
  rental_3_room_min = 3800,
  rental_3_room_max = 5000,
  rental_4_room_min = 5000,
  rental_4_room_max = 6500,
  rental_5_room_min = 6000,
  rental_5_room_max = 8000,
  data_sources = '{"price_data": "CBS, Madlan, Kantahome 2024-2025", "rental_data": "Yad2, HomeClick surveys", "arnona": "Ashdod Municipality 2024-2025"}'::jsonb,
  last_verified = '2025-01-13',
  updated_at = now()
WHERE city_slug = 'ashdod';

UPDATE city_canonical_metrics SET
  average_price_sqm = 27000,
  median_apartment_price = 2800000,
  yoy_price_change = -4.3,
  gross_yield_percent = 2.6,
  net_yield_percent = 1.6,
  arnona_rate_sqm = 68,
  arnona_monthly_avg = 545,
  rental_3_room_min = 4500,
  rental_3_room_max = 6000,
  rental_4_room_min = 6000,
  rental_4_room_max = 8000,
  rental_5_room_min = 7500,
  rental_5_room_max = 10000,
  data_sources = '{"price_data": "CBS, Madlan, Kantahome 2024-2025", "rental_data": "Yad2, HomeClick surveys", "arnona": "Modi''in Municipality 2024-2025"}'::jsonb,
  last_verified = '2025-01-13',
  updated_at = now()
WHERE city_slug = 'modiin';

-- Phase 6: Update cities table with research range values
UPDATE cities SET
  average_price_sqm = 27000,
  average_price_sqm_min = 12000,
  average_price_sqm_max = 30000,
  median_apartment_price = 2568000,
  yoy_price_change = -6.2,
  gross_yield_percent = 2.8,
  gross_yield_percent_min = 2.4,
  gross_yield_percent_max = 3.2,
  net_yield_percent = 1.8,
  net_yield_percent_min = 1.4,
  net_yield_percent_max = 2.2,
  arnona_rate_sqm = 62,
  arnona_rate_sqm_min = 40,
  arnona_rate_sqm_max = 84,
  arnona_monthly_avg = 500,
  rental_3_room_min = 4000,
  rental_3_room_max = 5500,
  rental_4_room_min = 5500,
  rental_4_room_max = 7500,
  rental_5_room_min = 7000,
  rental_5_room_max = 9500,
  updated_at = now()
WHERE slug = 'netanya';

UPDATE cities SET
  average_price_sqm = 20500,
  average_price_sqm_min = 12000,
  average_price_sqm_max = 25000,
  median_apartment_price = 1800000,
  yoy_price_change = -6.8,
  gross_yield_percent = 3.5,
  gross_yield_percent_min = 3.0,
  gross_yield_percent_max = 4.0,
  net_yield_percent = 2.5,
  net_yield_percent_min = 2.0,
  net_yield_percent_max = 3.0,
  arnona_rate_sqm = 52,
  arnona_rate_sqm_min = 35,
  arnona_rate_sqm_max = 70,
  arnona_monthly_avg = 420,
  rental_3_room_min = 3500,
  rental_3_room_max = 4500,
  rental_4_room_min = 4500,
  rental_4_room_max = 6000,
  rental_5_room_min = 5500,
  rental_5_room_max = 7500,
  updated_at = now()
WHERE slug = 'hadera';

UPDATE cities SET
  average_price_sqm = 37500,
  average_price_sqm_min = 30000,
  average_price_sqm_max = 50000,
  median_apartment_price = 8500000,
  yoy_price_change = -2.6,
  gross_yield_percent = 2.0,
  gross_yield_percent_min = 1.5,
  gross_yield_percent_max = 2.5,
  net_yield_percent = 1.2,
  net_yield_percent_min = 0.8,
  net_yield_percent_max = 1.6,
  arnona_rate_sqm = 95,
  arnona_rate_sqm_min = 80,
  arnona_rate_sqm_max = 120,
  arnona_monthly_avg = 1200,
  rental_3_room_min = 8000,
  rental_3_room_max = 12000,
  rental_4_room_min = 12000,
  rental_4_room_max = 18000,
  rental_5_room_min = 15000,
  rental_5_room_max = 25000,
  updated_at = now()
WHERE slug = 'caesarea';

UPDATE cities SET
  average_price_sqm = 18500,
  average_price_sqm_min = 10000,
  average_price_sqm_max = 28000,
  median_apartment_price = 1650000,
  yoy_price_change = -6.6,
  gross_yield_percent = 4.2,
  gross_yield_percent_min = 3.5,
  gross_yield_percent_max = 5.0,
  net_yield_percent = 3.2,
  net_yield_percent_min = 2.5,
  net_yield_percent_max = 4.0,
  arnona_rate_sqm = 58,
  arnona_rate_sqm_min = 38,
  arnona_rate_sqm_max = 78,
  arnona_monthly_avg = 465,
  rental_3_room_min = 3200,
  rental_3_room_max = 4200,
  rental_4_room_min = 4200,
  rental_4_room_max = 5500,
  rental_5_room_min = 5000,
  rental_5_room_max = 7000,
  updated_at = now()
WHERE slug = 'haifa';

UPDATE cities SET
  average_price_sqm = 23000,
  average_price_sqm_min = 15000,
  average_price_sqm_max = 30000,
  median_apartment_price = 2100000,
  yoy_price_change = -5.0,
  gross_yield_percent = 3.2,
  gross_yield_percent_min = 2.8,
  gross_yield_percent_max = 3.8,
  net_yield_percent = 2.2,
  net_yield_percent_min = 1.8,
  net_yield_percent_max = 2.8,
  arnona_rate_sqm = 55,
  arnona_rate_sqm_min = 38,
  arnona_rate_sqm_max = 72,
  arnona_monthly_avg = 440,
  rental_3_room_min = 3800,
  rental_3_room_max = 5000,
  rental_4_room_min = 5000,
  rental_4_room_max = 6500,
  rental_5_room_min = 6000,
  rental_5_room_max = 8000,
  updated_at = now()
WHERE slug = 'ashdod';

UPDATE cities SET
  average_price_sqm = 27000,
  average_price_sqm_min = 20000,
  average_price_sqm_max = 35000,
  median_apartment_price = 2800000,
  yoy_price_change = -4.3,
  gross_yield_percent = 2.6,
  gross_yield_percent_min = 2.2,
  gross_yield_percent_max = 3.0,
  net_yield_percent = 1.6,
  net_yield_percent_min = 1.2,
  net_yield_percent_max = 2.0,
  arnona_rate_sqm = 68,
  arnona_rate_sqm_min = 50,
  arnona_rate_sqm_max = 85,
  arnona_monthly_avg = 545,
  rental_3_room_min = 4500,
  rental_3_room_max = 6000,
  rental_4_room_min = 6000,
  rental_4_room_max = 8000,
  rental_5_room_min = 7500,
  rental_5_room_max = 10000,
  updated_at = now()
WHERE slug = 'modiin';
