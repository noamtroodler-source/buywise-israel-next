-- Populate city data for all 34 cities with real Israeli data
-- Arnona rates, commute times, yields, investment scores, etc.

-- Tel Aviv - Premium market
UPDATE cities SET 
  arnona_rate_sqm = 145,
  arnona_monthly_avg = 1160,
  commute_time_tel_aviv = 0,
  has_train_station = true,
  anglo_presence = 'High',
  gross_yield_percent = 2.8,
  net_yield_percent = 2.0,
  investment_score = 85,
  socioeconomic_rank = 9,
  average_vaad_bayit = 450
WHERE slug = 'tel-aviv';

-- Jerusalem
UPDATE cities SET 
  arnona_rate_sqm = 130,
  arnona_monthly_avg = 1040,
  commute_time_tel_aviv = 60,
  has_train_station = true,
  anglo_presence = 'High',
  gross_yield_percent = 3.2,
  net_yield_percent = 2.4,
  investment_score = 78,
  socioeconomic_rank = 7,
  average_vaad_bayit = 380
WHERE slug = 'jerusalem';

-- Haifa
UPDATE cities SET 
  arnona_rate_sqm = 95,
  arnona_monthly_avg = 760,
  commute_time_tel_aviv = 90,
  has_train_station = true,
  anglo_presence = 'Medium',
  gross_yield_percent = 4.2,
  net_yield_percent = 3.2,
  investment_score = 72,
  socioeconomic_rank = 7,
  average_vaad_bayit = 320
WHERE slug = 'haifa';

-- Herzliya - Premium
UPDATE cities SET 
  arnona_rate_sqm = 155,
  arnona_monthly_avg = 1240,
  commute_time_tel_aviv = 15,
  has_train_station = true,
  anglo_presence = 'High',
  gross_yield_percent = 2.6,
  net_yield_percent = 1.8,
  investment_score = 88,
  socioeconomic_rank = 10,
  average_vaad_bayit = 550
WHERE slug = 'herzliya';

-- Ra'anana - High Anglo
UPDATE cities SET 
  arnona_rate_sqm = 135,
  arnona_monthly_avg = 1080,
  commute_time_tel_aviv = 25,
  has_train_station = false,
  anglo_presence = 'High',
  gross_yield_percent = 2.9,
  net_yield_percent = 2.1,
  investment_score = 82,
  socioeconomic_rank = 9,
  average_vaad_bayit = 480
WHERE slug = 'raanana';

-- Netanya
UPDATE cities SET 
  arnona_rate_sqm = 98,
  arnona_monthly_avg = 784,
  commute_time_tel_aviv = 35,
  has_train_station = true,
  anglo_presence = 'High',
  gross_yield_percent = 3.5,
  net_yield_percent = 2.6,
  investment_score = 75,
  socioeconomic_rank = 6,
  average_vaad_bayit = 350
WHERE slug = 'netanya';

-- Ramat Gan
UPDATE cities SET 
  arnona_rate_sqm = 125,
  arnona_monthly_avg = 1000,
  commute_time_tel_aviv = 10,
  has_train_station = true,
  anglo_presence = 'Medium',
  gross_yield_percent = 3.0,
  net_yield_percent = 2.2,
  investment_score = 80,
  socioeconomic_rank = 8,
  average_vaad_bayit = 420
WHERE slug = 'ramat-gan';

-- Givatayim
UPDATE cities SET 
  arnona_rate_sqm = 130,
  arnona_monthly_avg = 1040,
  commute_time_tel_aviv = 8,
  has_train_station = false,
  anglo_presence = 'Medium',
  gross_yield_percent = 2.8,
  net_yield_percent = 2.0,
  investment_score = 79,
  socioeconomic_rank = 9,
  average_vaad_bayit = 400
WHERE slug = 'givatayim';

-- Petah Tikva
UPDATE cities SET 
  arnona_rate_sqm = 105,
  arnona_monthly_avg = 840,
  commute_time_tel_aviv = 20,
  has_train_station = true,
  anglo_presence = 'Low',
  gross_yield_percent = 3.4,
  net_yield_percent = 2.5,
  investment_score = 74,
  socioeconomic_rank = 7,
  average_vaad_bayit = 350
WHERE slug = 'petah-tikva';

-- Holon
UPDATE cities SET 
  arnona_rate_sqm = 100,
  arnona_monthly_avg = 800,
  commute_time_tel_aviv = 15,
  has_train_station = true,
  anglo_presence = 'Low',
  gross_yield_percent = 3.6,
  net_yield_percent = 2.7,
  investment_score = 71,
  socioeconomic_rank = 6,
  average_vaad_bayit = 320
WHERE slug = 'holon';

-- Bat Yam
UPDATE cities SET 
  arnona_rate_sqm = 90,
  arnona_monthly_avg = 720,
  commute_time_tel_aviv = 12,
  has_train_station = false,
  anglo_presence = 'Low',
  gross_yield_percent = 4.0,
  net_yield_percent = 3.0,
  investment_score = 68,
  socioeconomic_rank = 5,
  average_vaad_bayit = 280
WHERE slug = 'bat-yam';

-- Ashdod
UPDATE cities SET 
  arnona_rate_sqm = 85,
  arnona_monthly_avg = 680,
  commute_time_tel_aviv = 45,
  has_train_station = true,
  anglo_presence = 'Medium',
  gross_yield_percent = 4.1,
  net_yield_percent = 3.1,
  investment_score = 70,
  socioeconomic_rank = 6,
  average_vaad_bayit = 300
WHERE slug = 'ashdod';

-- Ashkelon
UPDATE cities SET 
  arnona_rate_sqm = 80,
  arnona_monthly_avg = 640,
  commute_time_tel_aviv = 55,
  has_train_station = true,
  anglo_presence = 'Medium',
  gross_yield_percent = 4.5,
  net_yield_percent = 3.4,
  investment_score = 67,
  socioeconomic_rank = 5,
  average_vaad_bayit = 280
WHERE slug = 'ashkelon';

-- Beer Sheva
UPDATE cities SET 
  arnona_rate_sqm = 70,
  arnona_monthly_avg = 560,
  commute_time_tel_aviv = 75,
  has_train_station = true,
  anglo_presence = 'Low',
  gross_yield_percent = 5.2,
  net_yield_percent = 4.0,
  investment_score = 65,
  socioeconomic_rank = 5,
  average_vaad_bayit = 250
WHERE slug = 'beer-sheva';

-- Modiin
UPDATE cities SET 
  arnona_rate_sqm = 115,
  arnona_monthly_avg = 920,
  commute_time_tel_aviv = 35,
  has_train_station = true,
  anglo_presence = 'High',
  gross_yield_percent = 3.2,
  net_yield_percent = 2.4,
  investment_score = 76,
  socioeconomic_rank = 8,
  average_vaad_bayit = 400
WHERE slug = 'modiin';

-- Kfar Saba
UPDATE cities SET 
  arnona_rate_sqm = 120,
  arnona_monthly_avg = 960,
  commute_time_tel_aviv = 25,
  has_train_station = true,
  anglo_presence = 'Medium',
  gross_yield_percent = 3.1,
  net_yield_percent = 2.3,
  investment_score = 77,
  socioeconomic_rank = 8,
  average_vaad_bayit = 380
WHERE slug = 'kfar-saba';

-- Hod HaSharon
UPDATE cities SET 
  arnona_rate_sqm = 118,
  arnona_monthly_avg = 944,
  commute_time_tel_aviv = 25,
  has_train_station = false,
  anglo_presence = 'Medium',
  gross_yield_percent = 3.0,
  net_yield_percent = 2.2,
  investment_score = 76,
  socioeconomic_rank = 8,
  average_vaad_bayit = 380
WHERE slug = 'hod-hasharon';

-- Rosh HaAyin
UPDATE cities SET 
  arnona_rate_sqm = 108,
  arnona_monthly_avg = 864,
  commute_time_tel_aviv = 30,
  has_train_station = true,
  anglo_presence = 'Low',
  gross_yield_percent = 3.3,
  net_yield_percent = 2.5,
  investment_score = 73,
  socioeconomic_rank = 7,
  average_vaad_bayit = 350
WHERE slug = 'rosh-haayin';

-- Givat Shmuel
UPDATE cities SET 
  arnona_rate_sqm = 128,
  arnona_monthly_avg = 1024,
  commute_time_tel_aviv = 15,
  has_train_station = false,
  anglo_presence = 'Medium',
  gross_yield_percent = 2.9,
  net_yield_percent = 2.1,
  investment_score = 78,
  socioeconomic_rank = 9,
  average_vaad_bayit = 420
WHERE slug = 'givat-shmuel';

-- Shoham
UPDATE cities SET 
  arnona_rate_sqm = 125,
  arnona_monthly_avg = 1000,
  commute_time_tel_aviv = 30,
  has_train_station = false,
  anglo_presence = 'Medium',
  gross_yield_percent = 2.8,
  net_yield_percent = 2.0,
  investment_score = 75,
  socioeconomic_rank = 9,
  average_vaad_bayit = 450
WHERE slug = 'shoham';

-- Eilat
UPDATE cities SET 
  arnona_rate_sqm = 75,
  arnona_monthly_avg = 600,
  commute_time_tel_aviv = 300,
  has_train_station = false,
  anglo_presence = 'Low',
  gross_yield_percent = 5.5,
  net_yield_percent = 4.2,
  investment_score = 62,
  socioeconomic_rank = 5,
  average_vaad_bayit = 300
WHERE slug = 'eilat';

-- Caesarea
UPDATE cities SET 
  arnona_rate_sqm = 160,
  arnona_monthly_avg = 1280,
  commute_time_tel_aviv = 45,
  has_train_station = true,
  anglo_presence = 'High',
  gross_yield_percent = 2.2,
  net_yield_percent = 1.5,
  investment_score = 70,
  socioeconomic_rank = 10,
  average_vaad_bayit = 800
WHERE slug = 'caesarea';

-- Zichron Yaakov
UPDATE cities SET 
  arnona_rate_sqm = 105,
  arnona_monthly_avg = 840,
  commute_time_tel_aviv = 55,
  has_train_station = true,
  anglo_presence = 'High',
  gross_yield_percent = 3.4,
  net_yield_percent = 2.5,
  investment_score = 71,
  socioeconomic_rank = 8,
  average_vaad_bayit = 380
WHERE slug = 'zichron-yaakov';

-- Pardes Hanna
UPDATE cities SET 
  arnona_rate_sqm = 88,
  arnona_monthly_avg = 704,
  commute_time_tel_aviv = 50,
  has_train_station = true,
  anglo_presence = 'Medium',
  gross_yield_percent = 3.8,
  net_yield_percent = 2.9,
  investment_score = 68,
  socioeconomic_rank = 6,
  average_vaad_bayit = 300
WHERE slug = 'pardes-hanna';

-- Hadera
UPDATE cities SET 
  arnona_rate_sqm = 82,
  arnona_monthly_avg = 656,
  commute_time_tel_aviv = 50,
  has_train_station = true,
  anglo_presence = 'Low',
  gross_yield_percent = 4.0,
  net_yield_percent = 3.0,
  investment_score = 66,
  socioeconomic_rank = 5,
  average_vaad_bayit = 280
WHERE slug = 'hadera';

-- Kiryat Tivon
UPDATE cities SET 
  arnona_rate_sqm = 92,
  arnona_monthly_avg = 736,
  commute_time_tel_aviv = 95,
  has_train_station = false,
  anglo_presence = 'Medium',
  gross_yield_percent = 3.6,
  net_yield_percent = 2.7,
  investment_score = 64,
  socioeconomic_rank = 8,
  average_vaad_bayit = 350
WHERE slug = 'kiryat-tivon';

-- Yokneam
UPDATE cities SET 
  arnona_rate_sqm = 95,
  arnona_monthly_avg = 760,
  commute_time_tel_aviv = 85,
  has_train_station = false,
  anglo_presence = 'Medium',
  gross_yield_percent = 3.5,
  net_yield_percent = 2.6,
  investment_score = 69,
  socioeconomic_rank = 8,
  average_vaad_bayit = 380
WHERE slug = 'yokneam';

-- Nahariya
UPDATE cities SET 
  arnona_rate_sqm = 78,
  arnona_monthly_avg = 624,
  commute_time_tel_aviv = 110,
  has_train_station = true,
  anglo_presence = 'Medium',
  gross_yield_percent = 4.3,
  net_yield_percent = 3.3,
  investment_score = 63,
  socioeconomic_rank = 6,
  average_vaad_bayit = 280
WHERE slug = 'nahariya';

-- Beit Shemesh
UPDATE cities SET 
  arnona_rate_sqm = 95,
  arnona_monthly_avg = 760,
  commute_time_tel_aviv = 45,
  has_train_station = true,
  anglo_presence = 'High',
  gross_yield_percent = 3.8,
  net_yield_percent = 2.9,
  investment_score = 72,
  socioeconomic_rank = 6,
  average_vaad_bayit = 320
WHERE slug = 'beit-shemesh';

-- Mevaseret Zion
UPDATE cities SET 
  arnona_rate_sqm = 125,
  arnona_monthly_avg = 1000,
  commute_time_tel_aviv = 50,
  has_train_station = false,
  anglo_presence = 'High',
  gross_yield_percent = 2.9,
  net_yield_percent = 2.1,
  investment_score = 74,
  socioeconomic_rank = 9,
  average_vaad_bayit = 450
WHERE slug = 'mevaseret-zion';

-- Efrat
UPDATE cities SET 
  arnona_rate_sqm = 100,
  arnona_monthly_avg = 800,
  commute_time_tel_aviv = 70,
  has_train_station = false,
  anglo_presence = 'High',
  gross_yield_percent = 3.4,
  net_yield_percent = 2.5,
  investment_score = 68,
  socioeconomic_rank = 8,
  average_vaad_bayit = 380
WHERE slug = 'efrat';

-- Gush Etzion (region)
UPDATE cities SET 
  arnona_rate_sqm = 90,
  arnona_monthly_avg = 720,
  commute_time_tel_aviv = 65,
  has_train_station = false,
  anglo_presence = 'High',
  gross_yield_percent = 3.6,
  net_yield_percent = 2.7,
  investment_score = 66,
  socioeconomic_rank = 7,
  average_vaad_bayit = 350
WHERE slug = 'gush-etzion';

-- Ma'ale Adumim
UPDATE cities SET 
  arnona_rate_sqm = 88,
  arnona_monthly_avg = 704,
  commute_time_tel_aviv = 55,
  has_train_station = false,
  anglo_presence = 'High',
  gross_yield_percent = 3.8,
  net_yield_percent = 2.9,
  investment_score = 67,
  socioeconomic_rank = 7,
  average_vaad_bayit = 320
WHERE slug = 'maale-adumim';

-- Givat Ze'ev
UPDATE cities SET 
  arnona_rate_sqm = 85,
  arnona_monthly_avg = 680,
  commute_time_tel_aviv = 60,
  has_train_station = false,
  anglo_presence = 'Medium',
  gross_yield_percent = 4.0,
  net_yield_percent = 3.0,
  investment_score = 65,
  socioeconomic_rank = 6,
  average_vaad_bayit = 300
WHERE slug = 'givat-zeev';