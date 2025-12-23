-- Populate complete city data for all 34 cities with all metrics
-- Price data, rental ranges, YoY changes

-- Tel Aviv - Premium market
UPDATE cities SET 
  average_price_sqm = 54500,
  median_apartment_price = 4500000,
  yoy_price_change = 5.8,
  rental_3_room_min = 6500,
  rental_3_room_max = 9500,
  rental_4_room_min = 8500,
  rental_4_room_max = 14000
WHERE slug = 'tel-aviv';

-- Jerusalem
UPDATE cities SET 
  average_price_sqm = 38000,
  median_apartment_price = 2800000,
  yoy_price_change = 4.2,
  rental_3_room_min = 4500,
  rental_3_room_max = 7000,
  rental_4_room_min = 6000,
  rental_4_room_max = 10000
WHERE slug = 'jerusalem';

-- Haifa
UPDATE cities SET 
  average_price_sqm = 22000,
  median_apartment_price = 1650000,
  yoy_price_change = 6.5,
  rental_3_room_min = 3200,
  rental_3_room_max = 4800,
  rental_4_room_min = 4000,
  rental_4_room_max = 6500
WHERE slug = 'haifa';

-- Herzliya - Premium
UPDATE cities SET 
  average_price_sqm = 48000,
  median_apartment_price = 3800000,
  yoy_price_change = 4.5,
  rental_3_room_min = 6000,
  rental_3_room_max = 8500,
  rental_4_room_min = 8000,
  rental_4_room_max = 12000
WHERE slug = 'herzliya';

-- Ra'anana
UPDATE cities SET 
  average_price_sqm = 42000,
  median_apartment_price = 3200000,
  yoy_price_change = 5.2,
  rental_3_room_min = 5500,
  rental_3_room_max = 7500,
  rental_4_room_min = 7000,
  rental_4_room_max = 10000
WHERE slug = 'raanana';

-- Netanya
UPDATE cities SET 
  average_price_sqm = 28000,
  median_apartment_price = 2100000,
  yoy_price_change = 7.8,
  rental_3_room_min = 4000,
  rental_3_room_max = 5500,
  rental_4_room_min = 5000,
  rental_4_room_max = 7500
WHERE slug = 'netanya';

-- Ramat Gan
UPDATE cities SET 
  average_price_sqm = 38000,
  median_apartment_price = 2900000,
  yoy_price_change = 5.5,
  rental_3_room_min = 5000,
  rental_3_room_max = 7000,
  rental_4_room_min = 6500,
  rental_4_room_max = 9500
WHERE slug = 'ramat-gan';

-- Givatayim
UPDATE cities SET 
  average_price_sqm = 40000,
  median_apartment_price = 3000000,
  yoy_price_change = 4.8,
  rental_3_room_min = 5200,
  rental_3_room_max = 7200,
  rental_4_room_min = 6800,
  rental_4_room_max = 9800
WHERE slug = 'givatayim';

-- Petah Tikva
UPDATE cities SET 
  average_price_sqm = 28000,
  median_apartment_price = 2200000,
  yoy_price_change = 6.2,
  rental_3_room_min = 4000,
  rental_3_room_max = 5500,
  rental_4_room_min = 5000,
  rental_4_room_max = 7000
WHERE slug = 'petah-tikva';

-- Holon
UPDATE cities SET 
  average_price_sqm = 26000,
  median_apartment_price = 1950000,
  yoy_price_change = 7.0,
  rental_3_room_min = 3800,
  rental_3_room_max = 5000,
  rental_4_room_min = 4500,
  rental_4_room_max = 6500
WHERE slug = 'holon';

-- Bat Yam
UPDATE cities SET 
  average_price_sqm = 24000,
  median_apartment_price = 1800000,
  yoy_price_change = 8.5,
  rental_3_room_min = 3500,
  rental_3_room_max = 4800,
  rental_4_room_min = 4200,
  rental_4_room_max = 6000
WHERE slug = 'bat-yam';

-- Ashdod
UPDATE cities SET 
  average_price_sqm = 22000,
  median_apartment_price = 1700000,
  yoy_price_change = 9.2,
  rental_3_room_min = 3200,
  rental_3_room_max = 4500,
  rental_4_room_min = 4000,
  rental_4_room_max = 5800
WHERE slug = 'ashdod';

-- Ashkelon
UPDATE cities SET 
  average_price_sqm = 18000,
  median_apartment_price = 1400000,
  yoy_price_change = 10.5,
  rental_3_room_min = 2800,
  rental_3_room_max = 4000,
  rental_4_room_min = 3500,
  rental_4_room_max = 5200
WHERE slug = 'ashkelon';

-- Beer Sheva
UPDATE cities SET 
  average_price_sqm = 15000,
  median_apartment_price = 1150000,
  yoy_price_change = 12.0,
  rental_3_room_min = 2500,
  rental_3_room_max = 3500,
  rental_4_room_min = 3000,
  rental_4_room_max = 4500
WHERE slug = 'beer-sheva';

-- Modiin
UPDATE cities SET 
  average_price_sqm = 32000,
  median_apartment_price = 2500000,
  yoy_price_change = 6.0,
  rental_3_room_min = 4500,
  rental_3_room_max = 6000,
  rental_4_room_min = 5500,
  rental_4_room_max = 7500
WHERE slug = 'modiin';

-- Kfar Saba
UPDATE cities SET 
  average_price_sqm = 34000,
  median_apartment_price = 2600000,
  yoy_price_change = 5.8,
  rental_3_room_min = 4800,
  rental_3_room_max = 6200,
  rental_4_room_min = 5800,
  rental_4_room_max = 7800
WHERE slug = 'kfar-saba';

-- Hod HaSharon
UPDATE cities SET 
  average_price_sqm = 33000,
  median_apartment_price = 2550000,
  yoy_price_change = 5.5,
  rental_3_room_min = 4600,
  rental_3_room_max = 6000,
  rental_4_room_min = 5600,
  rental_4_room_max = 7500
WHERE slug = 'hod-hasharon';

-- Rosh HaAyin
UPDATE cities SET 
  average_price_sqm = 28000,
  median_apartment_price = 2150000,
  yoy_price_change = 6.8,
  rental_3_room_min = 4200,
  rental_3_room_max = 5500,
  rental_4_room_min = 5000,
  rental_4_room_max = 7000
WHERE slug = 'rosh-haayin';

-- Givat Shmuel
UPDATE cities SET 
  average_price_sqm = 36000,
  median_apartment_price = 2750000,
  yoy_price_change = 5.0,
  rental_3_room_min = 5000,
  rental_3_room_max = 6500,
  rental_4_room_min = 6000,
  rental_4_room_max = 8500
WHERE slug = 'givat-shmuel';

-- Shoham
UPDATE cities SET 
  average_price_sqm = 35000,
  median_apartment_price = 2700000,
  yoy_price_change = 4.5,
  rental_3_room_min = 4800,
  rental_3_room_max = 6200,
  rental_4_room_min = 5800,
  rental_4_room_max = 8000
WHERE slug = 'shoham';

-- Eilat
UPDATE cities SET 
  average_price_sqm = 20000,
  median_apartment_price = 1500000,
  yoy_price_change = 8.0,
  rental_3_room_min = 3500,
  rental_3_room_max = 5000,
  rental_4_room_min = 4500,
  rental_4_room_max = 7000
WHERE slug = 'eilat';

-- Caesarea
UPDATE cities SET 
  average_price_sqm = 55000,
  median_apartment_price = 5500000,
  yoy_price_change = 3.0,
  rental_3_room_min = 6500,
  rental_3_room_max = 10000,
  rental_4_room_min = 9000,
  rental_4_room_max = 15000
WHERE slug = 'caesarea';

-- Zichron Yaakov
UPDATE cities SET 
  average_price_sqm = 30000,
  median_apartment_price = 2300000,
  yoy_price_change = 5.5,
  rental_3_room_min = 4200,
  rental_3_room_max = 5800,
  rental_4_room_min = 5200,
  rental_4_room_max = 7500
WHERE slug = 'zichron-yaakov';

-- Pardes Hanna
UPDATE cities SET 
  average_price_sqm = 22000,
  median_apartment_price = 1700000,
  yoy_price_change = 7.5,
  rental_3_room_min = 3200,
  rental_3_room_max = 4500,
  rental_4_room_min = 4000,
  rental_4_room_max = 5800
WHERE slug = 'pardes-hanna';

-- Hadera
UPDATE cities SET 
  average_price_sqm = 20000,
  median_apartment_price = 1550000,
  yoy_price_change = 8.0,
  rental_3_room_min = 3000,
  rental_3_room_max = 4200,
  rental_4_room_min = 3800,
  rental_4_room_max = 5500
WHERE slug = 'hadera';

-- Kiryat Tivon
UPDATE cities SET 
  average_price_sqm = 24000,
  median_apartment_price = 1850000,
  yoy_price_change = 5.0,
  rental_3_room_min = 3500,
  rental_3_room_max = 4800,
  rental_4_room_min = 4200,
  rental_4_room_max = 6000
WHERE slug = 'kiryat-tivon';

-- Yokneam
UPDATE cities SET 
  average_price_sqm = 26000,
  median_apartment_price = 2000000,
  yoy_price_change = 6.0,
  rental_3_room_min = 3800,
  rental_3_room_max = 5200,
  rental_4_room_min = 4500,
  rental_4_room_max = 6500
WHERE slug = 'yokneam';

-- Nahariya
UPDATE cities SET 
  average_price_sqm = 18000,
  median_apartment_price = 1400000,
  yoy_price_change = 7.0,
  rental_3_room_min = 2800,
  rental_3_room_max = 4000,
  rental_4_room_min = 3500,
  rental_4_room_max = 5200
WHERE slug = 'nahariya';

-- Beit Shemesh
UPDATE cities SET 
  average_price_sqm = 25000,
  median_apartment_price = 1900000,
  yoy_price_change = 7.2,
  rental_3_room_min = 3800,
  rental_3_room_max = 5200,
  rental_4_room_min = 4500,
  rental_4_room_max = 6500
WHERE slug = 'beit-shemesh';

-- Mevaseret Zion
UPDATE cities SET 
  average_price_sqm = 38000,
  median_apartment_price = 2900000,
  yoy_price_change = 4.0,
  rental_3_room_min = 5000,
  rental_3_room_max = 6800,
  rental_4_room_min = 6200,
  rental_4_room_max = 8500
WHERE slug = 'mevaseret-zion';

-- Efrat
UPDATE cities SET 
  average_price_sqm = 28000,
  median_apartment_price = 2200000,
  yoy_price_change = 4.5,
  rental_3_room_min = 4000,
  rental_3_room_max = 5500,
  rental_4_room_min = 5000,
  rental_4_room_max = 7000
WHERE slug = 'efrat';

-- Gush Etzion
UPDATE cities SET 
  average_price_sqm = 24000,
  median_apartment_price = 1850000,
  yoy_price_change = 5.0,
  rental_3_room_min = 3500,
  rental_3_room_max = 4800,
  rental_4_room_min = 4200,
  rental_4_room_max = 6000
WHERE slug = 'gush-etzion';

-- Ma'ale Adumim
UPDATE cities SET 
  average_price_sqm = 22000,
  median_apartment_price = 1700000,
  yoy_price_change = 5.5,
  rental_3_room_min = 3200,
  rental_3_room_max = 4500,
  rental_4_room_min = 4000,
  rental_4_room_max = 5800
WHERE slug = 'maale-adumim';

-- Givat Ze'ev
UPDATE cities SET 
  average_price_sqm = 20000,
  median_apartment_price = 1550000,
  yoy_price_change = 6.0,
  rental_3_room_min = 3000,
  rental_3_room_max = 4200,
  rental_4_room_min = 3800,
  rental_4_room_max = 5500
WHERE slug = 'givat-zeev';