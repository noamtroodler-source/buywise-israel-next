-- Update cities table with accurate data from research reports
-- All 34 cities with prices, yields, arnona rates

-- 1. Ashdod
UPDATE public.cities SET 
  average_price_sqm = 23000,
  median_apartment_price = 2115000,
  price_range_min = 1400000,
  price_range_max = 3200000,
  yoy_price_change = 6.0,
  gross_yield_percent = 2.5,
  arnona_rate_sqm = 70,
  arnona_monthly_avg = 583,
  rental_3_room_min = 3500,
  rental_3_room_max = 4500,
  rental_4_room_min = 4500,
  rental_4_room_max = 5500
WHERE slug = 'ashdod';

-- 2. Ashkelon
UPDATE public.cities SET 
  average_price_sqm = 15000,
  median_apartment_price = 1750000,
  price_range_min = 1100000,
  price_range_max = 2600000,
  yoy_price_change = 8.0,
  gross_yield_percent = 3.0,
  arnona_rate_sqm = 72,
  arnona_monthly_avg = 600,
  rental_3_room_min = 2800,
  rental_3_room_max = 3400,
  rental_4_room_min = 3700,
  rental_4_room_max = 4500
WHERE slug = 'ashkelon';

-- 3. Bat Yam
UPDATE public.cities SET 
  average_price_sqm = 24000,
  median_apartment_price = 2470000,
  price_range_min = 1800000,
  price_range_max = 3500000,
  yoy_price_change = 4.2,
  gross_yield_percent = 2.5,
  arnona_rate_sqm = 120,
  arnona_monthly_avg = 1000,
  rental_3_room_min = 4000,
  rental_3_room_max = 5000,
  rental_4_room_min = 5000,
  rental_4_room_max = 6500
WHERE slug = 'bat-yam';

-- 4. Be'er Sheva
UPDATE public.cities SET 
  average_price_sqm = 13500,
  median_apartment_price = 1220000,
  price_range_min = 800000,
  price_range_max = 2000000,
  yoy_price_change = 3.0,
  gross_yield_percent = 3.5,
  arnona_rate_sqm = 75,
  arnona_monthly_avg = 625,
  rental_3_room_min = 2500,
  rental_3_room_max = 3200,
  rental_4_room_min = 3200,
  rental_4_room_max = 4000
WHERE slug = 'beer-sheva';

-- 5. Beit Shemesh
UPDATE public.cities SET 
  average_price_sqm = 19000,
  median_apartment_price = 2435000,
  price_range_min = 1500000,
  price_range_max = 4000000,
  yoy_price_change = 6.3,
  gross_yield_percent = 2.8,
  arnona_rate_sqm = 84,
  arnona_monthly_avg = 700,
  rental_3_room_min = 3200,
  rental_3_room_max = 4200,
  rental_4_room_min = 4000,
  rental_4_room_max = 5000
WHERE slug = 'beit-shemesh';

-- 6. Caesarea
UPDATE public.cities SET 
  average_price_sqm = 35000,
  median_apartment_price = 6500000,
  price_range_min = 4000000,
  price_range_max = 15000000,
  yoy_price_change = 2.0,
  gross_yield_percent = 1.5,
  arnona_rate_sqm = 150,
  arnona_monthly_avg = 1250,
  rental_3_room_min = 6000,
  rental_3_room_max = 8000,
  rental_4_room_min = 8000,
  rental_4_room_max = 12000
WHERE slug = 'caesarea';

-- 7. Efrat
UPDATE public.cities SET 
  average_price_sqm = 20000,
  median_apartment_price = 2500000,
  price_range_min = 1800000,
  price_range_max = 4000000,
  yoy_price_change = 5.0,
  gross_yield_percent = 2.5,
  arnona_rate_sqm = 80,
  arnona_monthly_avg = 667,
  rental_3_room_min = 3500,
  rental_3_room_max = 4500,
  rental_4_room_min = 4500,
  rental_4_room_max = 5500
WHERE slug = 'efrat';

-- 8. Eilat
UPDATE public.cities SET 
  average_price_sqm = 18000,
  median_apartment_price = 1280000,
  price_range_min = 800000,
  price_range_max = 3000000,
  yoy_price_change = 4.0,
  gross_yield_percent = 4.0,
  arnona_rate_sqm = 0,
  arnona_monthly_avg = 0,
  rental_3_room_min = 3500,
  rental_3_room_max = 4500,
  rental_4_room_min = 4500,
  rental_4_room_max = 6000
WHERE slug = 'eilat';

-- 9. Givat Shmuel
UPDATE public.cities SET 
  average_price_sqm = 32000,
  median_apartment_price = 3200000,
  price_range_min = 2200000,
  price_range_max = 4500000,
  yoy_price_change = 5.0,
  gross_yield_percent = 2.2,
  arnona_rate_sqm = 110,
  arnona_monthly_avg = 917,
  rental_3_room_min = 5000,
  rental_3_room_max = 6500,
  rental_4_room_min = 6500,
  rental_4_room_max = 8000
WHERE slug = 'givat-shmuel';

-- 10. Givat Ze'ev
UPDATE public.cities SET 
  average_price_sqm = 16000,
  median_apartment_price = 1800000,
  price_range_min = 1200000,
  price_range_max = 2800000,
  yoy_price_change = 6.0,
  gross_yield_percent = 3.0,
  arnona_rate_sqm = 70,
  arnona_monthly_avg = 583,
  rental_3_room_min = 3000,
  rental_3_room_max = 3800,
  rental_4_room_min = 3800,
  rental_4_room_max = 4800
WHERE slug = 'givat-zeev';

-- 11. Givatayim
UPDATE public.cities SET 
  average_price_sqm = 37000,
  median_apartment_price = 3730000,
  price_range_min = 2500000,
  price_range_max = 6000000,
  yoy_price_change = -5.0,
  gross_yield_percent = 2.0,
  arnona_rate_sqm = 126,
  arnona_monthly_avg = 1050,
  rental_3_room_min = 6000,
  rental_3_room_max = 7000,
  rental_4_room_min = 7500,
  rental_4_room_max = 9000
WHERE slug = 'givatayim';

-- 12. Gush Etzion
UPDATE public.cities SET 
  average_price_sqm = 17000,
  median_apartment_price = 2000000,
  price_range_min = 1400000,
  price_range_max = 3500000,
  yoy_price_change = 5.5,
  gross_yield_percent = 2.8,
  arnona_rate_sqm = 75,
  arnona_monthly_avg = 625,
  rental_3_room_min = 3200,
  rental_3_room_max = 4000,
  rental_4_room_min = 4000,
  rental_4_room_max = 5000
WHERE slug = 'gush-etzion';

-- 13. Hadera
UPDATE public.cities SET 
  average_price_sqm = 16000,
  median_apartment_price = 1730000,
  price_range_min = 1100000,
  price_range_max = 2800000,
  yoy_price_change = 7.0,
  gross_yield_percent = 3.2,
  arnona_rate_sqm = 78,
  arnona_monthly_avg = 650,
  rental_3_room_min = 3000,
  rental_3_room_max = 3800,
  rental_4_room_min = 3800,
  rental_4_room_max = 4800
WHERE slug = 'hadera';

-- 14. Haifa
UPDATE public.cities SET 
  average_price_sqm = 18000,
  median_apartment_price = 1770000,
  price_range_min = 900000,
  price_range_max = 4000000,
  yoy_price_change = 5.0,
  gross_yield_percent = 3.5,
  arnona_rate_sqm = 95,
  arnona_monthly_avg = 792,
  rental_3_room_min = 3500,
  rental_3_room_max = 4500,
  rental_4_room_min = 4500,
  rental_4_room_max = 6000
WHERE slug = 'haifa';

-- 15. Herzliya
UPDATE public.cities SET 
  average_price_sqm = 42000,
  median_apartment_price = 4280000,
  price_range_min = 2500000,
  price_range_max = 10000000,
  yoy_price_change = 3.0,
  gross_yield_percent = 2.0,
  arnona_rate_sqm = 130,
  arnona_monthly_avg = 1083,
  rental_3_room_min = 6500,
  rental_3_room_max = 8000,
  rental_4_room_min = 8000,
  rental_4_room_max = 12000
WHERE slug = 'herzliya';

-- 16. Hod HaSharon
UPDATE public.cities SET 
  average_price_sqm = 28000,
  median_apartment_price = 2900000,
  price_range_min = 2000000,
  price_range_max = 4500000,
  yoy_price_change = 4.0,
  gross_yield_percent = 2.3,
  arnona_rate_sqm = 105,
  arnona_monthly_avg = 875,
  rental_3_room_min = 5000,
  rental_3_room_max = 6000,
  rental_4_room_min = 6000,
  rental_4_room_max = 7500
WHERE slug = 'hod-hasharon';

-- 17. Holon
UPDATE public.cities SET 
  average_price_sqm = 24000,
  median_apartment_price = 2450000,
  price_range_min = 1700000,
  price_range_max = 3500000,
  yoy_price_change = 5.0,
  gross_yield_percent = 2.6,
  arnona_rate_sqm = 115,
  arnona_monthly_avg = 958,
  rental_3_room_min = 4000,
  rental_3_room_max = 5000,
  rental_4_room_min = 5000,
  rental_4_room_max = 6500
WHERE slug = 'holon';

-- 18. Jerusalem
UPDATE public.cities SET 
  average_price_sqm = 28000,
  median_apartment_price = 2950000,
  price_range_min = 1500000,
  price_range_max = 8000000,
  yoy_price_change = 4.5,
  gross_yield_percent = 2.5,
  arnona_rate_sqm = 105,
  arnona_monthly_avg = 875,
  rental_3_room_min = 4500,
  rental_3_room_max = 6000,
  rental_4_room_min = 6000,
  rental_4_room_max = 8000
WHERE slug = 'jerusalem';

-- 19. Kfar Saba
UPDATE public.cities SET 
  average_price_sqm = 28000,
  median_apartment_price = 2850000,
  price_range_min = 2000000,
  price_range_max = 4500000,
  yoy_price_change = 4.0,
  gross_yield_percent = 2.3,
  arnona_rate_sqm = 100,
  arnona_monthly_avg = 833,
  rental_3_room_min = 5000,
  rental_3_room_max = 6000,
  rental_4_room_min = 6000,
  rental_4_room_max = 7500
WHERE slug = 'kfar-saba';

-- 20. Kiryat Tivon
UPDATE public.cities SET 
  average_price_sqm = 18000,
  median_apartment_price = 2100000,
  price_range_min = 1400000,
  price_range_max = 3500000,
  yoy_price_change = 5.0,
  gross_yield_percent = 2.8,
  arnona_rate_sqm = 85,
  arnona_monthly_avg = 708,
  rental_3_room_min = 3500,
  rental_3_room_max = 4500,
  rental_4_room_min = 4500,
  rental_4_room_max = 5500
WHERE slug = 'kiryat-tivon';

-- 21. Ma'ale Adumim
UPDATE public.cities SET 
  average_price_sqm = 17000,
  median_apartment_price = 1950000,
  price_range_min = 1300000,
  price_range_max = 3000000,
  yoy_price_change = 5.0,
  gross_yield_percent = 3.0,
  arnona_rate_sqm = 72,
  arnona_monthly_avg = 600,
  rental_3_room_min = 3200,
  rental_3_room_max = 4000,
  rental_4_room_min = 4000,
  rental_4_room_max = 5000
WHERE slug = 'maale-adumim';

-- 22. Mevaseret Zion
UPDATE public.cities SET 
  average_price_sqm = 30000,
  median_apartment_price = 3500000,
  price_range_min = 2200000,
  price_range_max = 5500000,
  yoy_price_change = 3.0,
  gross_yield_percent = 2.2,
  arnona_rate_sqm = 95,
  arnona_monthly_avg = 792,
  rental_3_room_min = 5500,
  rental_3_room_max = 7000,
  rental_4_room_min = 7000,
  rental_4_room_max = 9000
WHERE slug = 'mevaseret-zion';

-- 23. Modi'in
UPDATE public.cities SET 
  average_price_sqm = 25000,
  median_apartment_price = 2700000,
  price_range_min = 1800000,
  price_range_max = 4500000,
  yoy_price_change = 5.0,
  gross_yield_percent = 2.4,
  arnona_rate_sqm = 92,
  arnona_monthly_avg = 767,
  rental_3_room_min = 4500,
  rental_3_room_max = 5500,
  rental_4_room_min = 5500,
  rental_4_room_max = 7000
WHERE slug = 'modiin';

-- 24. Nahariya
UPDATE public.cities SET 
  average_price_sqm = 14000,
  median_apartment_price = 1450000,
  price_range_min = 900000,
  price_range_max = 2500000,
  yoy_price_change = 6.0,
  gross_yield_percent = 3.3,
  arnona_rate_sqm = 80,
  arnona_monthly_avg = 667,
  rental_3_room_min = 2800,
  rental_3_room_max = 3500,
  rental_4_room_min = 3500,
  rental_4_room_max = 4500
WHERE slug = 'nahariya';

-- 25. Netanya
UPDATE public.cities SET 
  average_price_sqm = 22000,
  median_apartment_price = 2350000,
  price_range_min = 1400000,
  price_range_max = 5000000,
  yoy_price_change = 5.5,
  gross_yield_percent = 2.7,
  arnona_rate_sqm = 98,
  arnona_monthly_avg = 817,
  rental_3_room_min = 4000,
  rental_3_room_max = 5000,
  rental_4_room_min = 5000,
  rental_4_room_max = 6500
WHERE slug = 'netanya';

-- 26. Pardes Hanna-Karkur
UPDATE public.cities SET 
  average_price_sqm = 16000,
  median_apartment_price = 1850000,
  price_range_min = 1200000,
  price_range_max = 3000000,
  yoy_price_change = 6.5,
  gross_yield_percent = 3.0,
  arnona_rate_sqm = 82,
  arnona_monthly_avg = 683,
  rental_3_room_min = 3200,
  rental_3_room_max = 4000,
  rental_4_room_min = 4000,
  rental_4_room_max = 5000
WHERE slug = 'pardes-hanna';

-- 27. Petah Tikva
UPDATE public.cities SET 
  average_price_sqm = 25000,
  median_apartment_price = 2550000,
  price_range_min = 1700000,
  price_range_max = 4000000,
  yoy_price_change = 5.0,
  gross_yield_percent = 2.5,
  arnona_rate_sqm = 105,
  arnona_monthly_avg = 875,
  rental_3_room_min = 4500,
  rental_3_room_max = 5500,
  rental_4_room_min = 5500,
  rental_4_room_max = 7000
WHERE slug = 'petah-tikva';

-- 28. Ra'anana
UPDATE public.cities SET 
  average_price_sqm = 38000,
  median_apartment_price = 4020000,
  price_range_min = 2800000,
  price_range_max = 7000000,
  yoy_price_change = 3.0,
  gross_yield_percent = 2.0,
  arnona_rate_sqm = 115,
  arnona_monthly_avg = 958,
  rental_3_room_min = 6000,
  rental_3_room_max = 7500,
  rental_4_room_min = 7500,
  rental_4_room_max = 10000
WHERE slug = 'raanana';

-- 29. Ramat Gan
UPDATE public.cities SET 
  average_price_sqm = 35000,
  median_apartment_price = 3440000,
  price_range_min = 2200000,
  price_range_max = 6000000,
  yoy_price_change = 4.0,
  gross_yield_percent = 2.2,
  arnona_rate_sqm = 120,
  arnona_monthly_avg = 1000,
  rental_3_room_min = 5500,
  rental_3_room_max = 7000,
  rental_4_room_min = 7000,
  rental_4_room_max = 9000
WHERE slug = 'ramat-gan';

-- 30. Rosh HaAyin
UPDATE public.cities SET 
  average_price_sqm = 22000,
  median_apartment_price = 2300000,
  price_range_min = 1600000,
  price_range_max = 3500000,
  yoy_price_change = 5.5,
  gross_yield_percent = 2.6,
  arnona_rate_sqm = 90,
  arnona_monthly_avg = 750,
  rental_3_room_min = 4200,
  rental_3_room_max = 5200,
  rental_4_room_min = 5200,
  rental_4_room_max = 6500
WHERE slug = 'rosh-haayin';

-- 31. Shoham
UPDATE public.cities SET 
  average_price_sqm = 30000,
  median_apartment_price = 3400000,
  price_range_min = 2500000,
  price_range_max = 5000000,
  yoy_price_change = 4.0,
  gross_yield_percent = 2.2,
  arnona_rate_sqm = 100,
  arnona_monthly_avg = 833,
  rental_3_room_min = 5500,
  rental_3_room_max = 6500,
  rental_4_room_min = 6500,
  rental_4_room_max = 8000
WHERE slug = 'shoham';

-- 32. Tel Aviv
UPDATE public.cities SET 
  average_price_sqm = 52000,
  median_apartment_price = 4180000,
  price_range_min = 2500000,
  price_range_max = 15000000,
  yoy_price_change = 3.0,
  gross_yield_percent = 2.0,
  arnona_rate_sqm = 140,
  arnona_monthly_avg = 1167,
  rental_3_room_min = 7000,
  rental_3_room_max = 10000,
  rental_4_room_min = 10000,
  rental_4_room_max = 15000
WHERE slug = 'tel-aviv';

-- 33. Yokneam
UPDATE public.cities SET 
  average_price_sqm = 20000,
  median_apartment_price = 2300000,
  price_range_min = 1500000,
  price_range_max = 3800000,
  yoy_price_change = 5.5,
  gross_yield_percent = 2.6,
  arnona_rate_sqm = 85,
  arnona_monthly_avg = 708,
  rental_3_room_min = 4000,
  rental_3_room_max = 5000,
  rental_4_room_min = 5000,
  rental_4_room_max = 6500
WHERE slug = 'yokneam';

-- 34. Zichron Yaakov
UPDATE public.cities SET 
  average_price_sqm = 25000,
  median_apartment_price = 2800000,
  price_range_min = 1800000,
  price_range_max = 5000000,
  yoy_price_change = 4.5,
  gross_yield_percent = 2.3,
  arnona_rate_sqm = 90,
  arnona_monthly_avg = 750,
  rental_3_room_min = 4500,
  rental_3_room_max = 5500,
  rental_4_room_min = 5500,
  rental_4_room_max = 7000
WHERE slug = 'zichron-yaakov';

-- Now update rental_prices table with accurate 2-5 room data for all cities
-- First delete existing rental prices to avoid duplicates, then insert fresh data

DELETE FROM public.rental_prices;

-- Insert rental prices for all 34 cities (rooms 2-5)
INSERT INTO public.rental_prices (city, rooms, price_min, price_max, currency) VALUES
-- Ashdod
('Ashdod', 2, 2800, 3800, '₪'),
('Ashdod', 3, 3500, 4500, '₪'),
('Ashdod', 4, 4500, 5500, '₪'),
('Ashdod', 5, 5500, 7000, '₪'),
-- Ashkelon
('Ashkelon', 2, 2200, 2800, '₪'),
('Ashkelon', 3, 2800, 3400, '₪'),
('Ashkelon', 4, 3700, 4500, '₪'),
('Ashkelon', 5, 4500, 5300, '₪'),
-- Bat Yam
('Bat Yam', 2, 3200, 4200, '₪'),
('Bat Yam', 3, 4000, 5000, '₪'),
('Bat Yam', 4, 5000, 6500, '₪'),
('Bat Yam', 5, 6000, 8000, '₪'),
-- Be'er Sheva
('Be''er Sheva', 2, 1800, 2500, '₪'),
('Be''er Sheva', 3, 2500, 3200, '₪'),
('Be''er Sheva', 4, 3200, 4000, '₪'),
('Be''er Sheva', 5, 3800, 4800, '₪'),
-- Beit Shemesh
('Beit Shemesh', 2, 2500, 3200, '₪'),
('Beit Shemesh', 3, 3200, 4200, '₪'),
('Beit Shemesh', 4, 4000, 5000, '₪'),
('Beit Shemesh', 5, 4800, 6000, '₪'),
-- Caesarea
('Caesarea', 2, 5000, 7000, '₪'),
('Caesarea', 3, 6000, 8000, '₪'),
('Caesarea', 4, 8000, 12000, '₪'),
('Caesarea', 5, 10000, 15000, '₪'),
-- Efrat
('Efrat', 2, 2800, 3500, '₪'),
('Efrat', 3, 3500, 4500, '₪'),
('Efrat', 4, 4500, 5500, '₪'),
('Efrat', 5, 5500, 7000, '₪'),
-- Eilat
('Eilat', 2, 2800, 3500, '₪'),
('Eilat', 3, 3500, 4500, '₪'),
('Eilat', 4, 4500, 6000, '₪'),
('Eilat', 5, 5500, 7500, '₪'),
-- Givat Shmuel
('Givat Shmuel', 2, 4000, 5000, '₪'),
('Givat Shmuel', 3, 5000, 6500, '₪'),
('Givat Shmuel', 4, 6500, 8000, '₪'),
('Givat Shmuel', 5, 8000, 10000, '₪'),
-- Givat Ze'ev
('Givat Ze''ev', 2, 2500, 3200, '₪'),
('Givat Ze''ev', 3, 3000, 3800, '₪'),
('Givat Ze''ev', 4, 3800, 4800, '₪'),
('Givat Ze''ev', 5, 4500, 5500, '₪'),
-- Givatayim
('Givatayim', 2, 4500, 5500, '₪'),
('Givatayim', 3, 6000, 7000, '₪'),
('Givatayim', 4, 7500, 9000, '₪'),
('Givatayim', 5, 9000, 11000, '₪'),
-- Gush Etzion
('Gush Etzion', 2, 2500, 3200, '₪'),
('Gush Etzion', 3, 3200, 4000, '₪'),
('Gush Etzion', 4, 4000, 5000, '₪'),
('Gush Etzion', 5, 5000, 6500, '₪'),
-- Hadera
('Hadera', 2, 2500, 3200, '₪'),
('Hadera', 3, 3000, 3800, '₪'),
('Hadera', 4, 3800, 4800, '₪'),
('Hadera', 5, 4500, 5800, '₪'),
-- Haifa
('Haifa', 2, 2800, 3500, '₪'),
('Haifa', 3, 3500, 4500, '₪'),
('Haifa', 4, 4500, 6000, '₪'),
('Haifa', 5, 5500, 7500, '₪'),
-- Herzliya
('Herzliya', 2, 5000, 6500, '₪'),
('Herzliya', 3, 6500, 8000, '₪'),
('Herzliya', 4, 8000, 12000, '₪'),
('Herzliya', 5, 10000, 15000, '₪'),
-- Hod HaSharon
('Hod HaSharon', 2, 4000, 5000, '₪'),
('Hod HaSharon', 3, 5000, 6000, '₪'),
('Hod HaSharon', 4, 6000, 7500, '₪'),
('Hod HaSharon', 5, 7500, 9500, '₪'),
-- Holon
('Holon', 2, 3200, 4200, '₪'),
('Holon', 3, 4000, 5000, '₪'),
('Holon', 4, 5000, 6500, '₪'),
('Holon', 5, 6000, 8000, '₪'),
-- Jerusalem
('Jerusalem', 2, 3500, 4500, '₪'),
('Jerusalem', 3, 4500, 6000, '₪'),
('Jerusalem', 4, 6000, 8000, '₪'),
('Jerusalem', 5, 7500, 10000, '₪'),
-- Kfar Saba
('Kfar Saba', 2, 4000, 5000, '₪'),
('Kfar Saba', 3, 5000, 6000, '₪'),
('Kfar Saba', 4, 6000, 7500, '₪'),
('Kfar Saba', 5, 7500, 9500, '₪'),
-- Kiryat Tivon
('Kiryat Tivon', 2, 2800, 3500, '₪'),
('Kiryat Tivon', 3, 3500, 4500, '₪'),
('Kiryat Tivon', 4, 4500, 5500, '₪'),
('Kiryat Tivon', 5, 5500, 7000, '₪'),
-- Ma'ale Adumim
('Ma''ale Adumim', 2, 2500, 3200, '₪'),
('Ma''ale Adumim', 3, 3200, 4000, '₪'),
('Ma''ale Adumim', 4, 4000, 5000, '₪'),
('Ma''ale Adumim', 5, 5000, 6500, '₪'),
-- Mevaseret Zion
('Mevaseret Zion', 2, 4500, 5500, '₪'),
('Mevaseret Zion', 3, 5500, 7000, '₪'),
('Mevaseret Zion', 4, 7000, 9000, '₪'),
('Mevaseret Zion', 5, 8500, 11000, '₪'),
-- Modi'in
('Modi''in', 2, 3500, 4500, '₪'),
('Modi''in', 3, 4500, 5500, '₪'),
('Modi''in', 4, 5500, 7000, '₪'),
('Modi''in', 5, 7000, 9000, '₪'),
-- Nahariya
('Nahariya', 2, 2200, 2800, '₪'),
('Nahariya', 3, 2800, 3500, '₪'),
('Nahariya', 4, 3500, 4500, '₪'),
('Nahariya', 5, 4200, 5500, '₪'),
-- Netanya
('Netanya', 2, 3200, 4200, '₪'),
('Netanya', 3, 4000, 5000, '₪'),
('Netanya', 4, 5000, 6500, '₪'),
('Netanya', 5, 6000, 8000, '₪'),
-- Pardes Hanna-Karkur
('Pardes Hanna', 2, 2500, 3200, '₪'),
('Pardes Hanna', 3, 3200, 4000, '₪'),
('Pardes Hanna', 4, 4000, 5000, '₪'),
('Pardes Hanna', 5, 5000, 6500, '₪'),
-- Petah Tikva
('Petah Tikva', 2, 3500, 4500, '₪'),
('Petah Tikva', 3, 4500, 5500, '₪'),
('Petah Tikva', 4, 5500, 7000, '₪'),
('Petah Tikva', 5, 7000, 9000, '₪'),
-- Ra'anana
('Ra''anana', 2, 5000, 6000, '₪'),
('Ra''anana', 3, 6000, 7500, '₪'),
('Ra''anana', 4, 7500, 10000, '₪'),
('Ra''anana', 5, 9000, 12000, '₪'),
-- Ramat Gan
('Ramat Gan', 2, 4500, 5500, '₪'),
('Ramat Gan', 3, 5500, 7000, '₪'),
('Ramat Gan', 4, 7000, 9000, '₪'),
('Ramat Gan', 5, 8500, 11000, '₪'),
-- Rosh HaAyin
('Rosh HaAyin', 2, 3500, 4200, '₪'),
('Rosh HaAyin', 3, 4200, 5200, '₪'),
('Rosh HaAyin', 4, 5200, 6500, '₪'),
('Rosh HaAyin', 5, 6500, 8000, '₪'),
-- Shoham
('Shoham', 2, 4500, 5500, '₪'),
('Shoham', 3, 5500, 6500, '₪'),
('Shoham', 4, 6500, 8000, '₪'),
('Shoham', 5, 8000, 10000, '₪'),
-- Tel Aviv
('Tel Aviv', 2, 5500, 8000, '₪'),
('Tel Aviv', 3, 7000, 10000, '₪'),
('Tel Aviv', 4, 10000, 15000, '₪'),
('Tel Aviv', 5, 13000, 20000, '₪'),
-- Yokneam
('Yokneam', 2, 3200, 4000, '₪'),
('Yokneam', 3, 4000, 5000, '₪'),
('Yokneam', 4, 5000, 6500, '₪'),
('Yokneam', 5, 6500, 8000, '₪'),
-- Zichron Yaakov
('Zichron Yaakov', 2, 3500, 4500, '₪'),
('Zichron Yaakov', 3, 4500, 5500, '₪'),
('Zichron Yaakov', 4, 5500, 7000, '₪'),
('Zichron Yaakov', 5, 7000, 9000, '₪');