
-- Step 1: Add train station columns to cities table
ALTER TABLE public.cities 
  ADD COLUMN IF NOT EXISTS train_station_name text,
  ADD COLUMN IF NOT EXISTS train_station_lat numeric,
  ADD COLUMN IF NOT EXISTS train_station_lng numeric;

-- Step 2: Populate train station data from existing city_anchors where city has_train_station = true
-- Plus fix Ra'anana (has_train_station was false but has a train station anchor)
UPDATE public.cities SET train_station_name = 'Ashdod Ad Halom Train Station', train_station_lat = 31.7989, train_station_lng = 34.6689 WHERE id = '72df4e99-6dcb-41a2-90b2-e0ce44932bfd';
UPDATE public.cities SET train_station_name = 'Ashkelon Train Station', train_station_lat = 31.6625, train_station_lng = 34.5714 WHERE id = 'fb505eb3-5b20-4b1c-8e40-82343f39578b';
UPDATE public.cities SET train_station_name = 'Be''er Sheva Center Train Station', train_station_lat = 31.2433, train_station_lng = 34.7989 WHERE id = '8a7aa261-2675-448d-aace-a7966acb68f8';
UPDATE public.cities SET train_station_name = 'Beit Shemesh Train Station', train_station_lat = 31.7467, train_station_lng = 34.9892 WHERE id = 'f9657448-93ce-4aaa-933b-bb80afcdf1b7';
UPDATE public.cities SET train_station_name = 'Hadera West Train Station', train_station_lat = 32.4606, train_station_lng = 34.9147 WHERE id = '137285b4-38c0-4194-aab5-33fa66ea7ea4';
UPDATE public.cities SET train_station_name = 'Haifa Center HaShmona Train Station', train_station_lat = 32.7911, train_station_lng = 35.0003 WHERE id = '9f2921ba-983e-4554-bbe0-2cb559b0b9ca';
UPDATE public.cities SET train_station_name = 'Herzliya Train Station', train_station_lat = 32.1569, train_station_lng = 34.8244 WHERE id = '4d3cd72a-6f70-4e9f-9ce8-c102d51f9034';
UPDATE public.cities SET train_station_name = 'Kfar Saba–Nordau Train Station', train_station_lat = 32.1822, train_station_lng = 34.9078 WHERE id = 'dee64601-5bac-44fc-ae10-1f4763b05829';
UPDATE public.cities SET train_station_name = 'Jerusalem Yitzhak Navon Train Station', train_station_lat = 31.7878, train_station_lng = 35.2033 WHERE id = '4f7c002a-b2f9-4449-83fa-ce9a934cb2fb';
UPDATE public.cities SET train_station_name = 'Kfar Saba–Nordau Train Station', train_station_lat = 32.1822, train_station_lng = 34.9078 WHERE id = 'b2199d81-7b99-4abf-9010-b25adb8a5915';
UPDATE public.cities SET train_station_name = 'Modiin Center Train Station', train_station_lat = 31.8958, train_station_lng = 35.0092 WHERE id = 'fa106edb-d938-4367-8543-5fee410f3898';
UPDATE public.cities SET train_station_name = 'Netanya Train Station', train_station_lat = 32.3311, train_station_lng = 34.8617 WHERE id = '11a8d815-7dd4-46ab-adc9-d58730f55c61';
UPDATE public.cities SET train_station_name = 'Pardes Hanna Train Station', train_station_lat = 32.4712, train_station_lng = 34.9698 WHERE id = '3c1c56cd-85d1-42c4-ba1d-b50818025ada';
UPDATE public.cities SET train_station_name = 'Petah Tikva–Segula Train Station', train_station_lat = 32.0878, train_station_lng = 34.8878 WHERE id = 'fa0ff028-9532-406b-a4cc-7ae6d3d31622';
UPDATE public.cities SET train_station_name = 'Savidor Center / Ayalon', train_station_lat = 32.0744, train_station_lng = 34.7989 WHERE id = 'dc3eda2b-3226-4a76-9274-ebf80d6fcfd8';
UPDATE public.cities SET train_station_name = 'Tel Aviv Savidor Center', train_station_lat = 32.0744, train_station_lng = 34.7989 WHERE id = '7d2f1e3a-8b4c-4f5e-a6d9-c0e7b3f2d1a5';
UPDATE public.cities SET train_station_name = 'Binyamina Train Station', train_station_lat = 32.5231, train_station_lng = 34.9467 WHERE id = 'b0e7c2d4-8f3a-4e5b-9d1c-a6f0e3b7d2c8';
-- Fix Ra'anana: set has_train_station = true and add train station data
UPDATE public.cities SET has_train_station = true, train_station_name = 'Ra''anana West Train Station', train_station_lat = 32.1875, train_station_lng = 34.8644 WHERE id = '34f29e8b-9582-43df-9c32-b142bbd80dc2';
