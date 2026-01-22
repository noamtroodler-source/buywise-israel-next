-- Create city_anchors table for curated location reference points
CREATE TABLE public.city_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  anchor_type TEXT NOT NULL CHECK (anchor_type IN ('orientation', 'daily_life', 'mobility')),
  name TEXT NOT NULL,
  name_he TEXT, -- Hebrew name for future localization
  description TEXT, -- Tooltip content explaining why this matters
  latitude NUMERIC,
  longitude NUMERIC,
  icon TEXT DEFAULT 'map-pin', -- Icon key for display
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_id, anchor_type) -- One anchor per type per city
);

-- Enable RLS
ALTER TABLE public.city_anchors ENABLE ROW LEVEL SECURITY;

-- Public read access (city anchors are public data)
CREATE POLICY "City anchors are publicly readable"
ON public.city_anchors
FOR SELECT
USING (true);

-- Only admins can modify (managed via dashboard/admin)
CREATE POLICY "Only admins can modify city anchors"
ON public.city_anchors
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for fast city lookups
CREATE INDEX idx_city_anchors_city_id ON public.city_anchors(city_id);

-- Seed data for all 25 cities (3 anchors per city: orientation, daily_life, mobility)

-- Tel Aviv
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('29327af0-025b-4515-93af-99bc6d0844df', 'orientation', 'Rothschild Boulevard', 'Tel Aviv''s iconic tree-lined boulevard and cultural hub. A key reference point for walkability, dining, and nightlife.', 32.0636, 34.7739, 'building', 1),
  ('29327af0-025b-4515-93af-99bc6d0844df', 'daily_life', 'Carmel Market', 'The city''s famous open-air market for fresh produce, street food, and local culture. A daily life anchor for residents.', 32.0677, 34.7687, 'shopping-bag', 2),
  ('29327af0-025b-4515-93af-99bc6d0844df', 'mobility', 'HaHagana Train Station', 'Major transit hub connecting Tel Aviv to the national rail network. Key for commuters.', 32.0555, 34.7854, 'train', 3);

-- Jerusalem
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('4f7c002a-b2f9-4449-83fa-ce9a934cb2fb', 'orientation', 'Jaffa Gate', 'Historic entrance to the Old City. Central reference point for navigation in Jerusalem.', 31.7767, 35.2275, 'building', 1),
  ('4f7c002a-b2f9-4449-83fa-ce9a934cb2fb', 'daily_life', 'Mahane Yehuda Market', 'Jerusalem''s vibrant food market, known as "The Shuk". Essential for daily shopping and local culture.', 31.7850, 35.2122, 'shopping-bag', 2),
  ('4f7c002a-b2f9-4449-83fa-ce9a934cb2fb', 'mobility', 'Central Bus Station', 'Israel''s main intercity transit hub. Proximity affects commute times across the country.', 31.7892, 35.2031, 'bus', 3);

-- Haifa
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('9f2921ba-983e-4554-bbe0-2cb559b0b9ca', 'orientation', 'Bahai Gardens', 'UNESCO World Heritage Site and Haifa''s most famous landmark. Defines the city''s terraced geography.', 32.8137, 34.9854, 'trees', 1),
  ('9f2921ba-983e-4554-bbe0-2cb559b0b9ca', 'daily_life', 'German Colony', 'Historic neighborhood with restaurants, cafes, and shops. The social heart of Haifa.', 32.8148, 34.9912, 'coffee', 2),
  ('9f2921ba-983e-4554-bbe0-2cb559b0b9ca', 'mobility', 'Haifa Merkaz HaShmona Station', 'Central train station connecting Haifa to Tel Aviv and northern Israel.', 32.7967, 35.0033, 'train', 3);

-- Ra'anana
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('34f29e8b-9582-43df-9c32-b142bbd80dc2', 'orientation', 'Ra''anana Park', 'The city''s central green space. A popular gathering point and orientation landmark.', 32.1850, 34.8750, 'trees', 1),
  ('34f29e8b-9582-43df-9c32-b142bbd80dc2', 'daily_life', 'Ahuza Street', 'Main commercial street with shops, restaurants, and services. The daily life hub.', 32.1820, 34.8712, 'shopping-bag', 2),
  ('34f29e8b-9582-43df-9c32-b142bbd80dc2', 'mobility', 'Ra''anana West Station', 'Train station connecting to Tel Aviv in 25 minutes. Key for commuters.', 32.1904, 34.8579, 'train', 3);

-- Herzliya
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('4d3cd72a-6f70-4e9f-9ce8-c102d51f9034', 'orientation', 'Herzliya Pituach Beach', 'Upscale beach area with marina. Defines Herzliya''s coastal identity.', 32.1650, 34.7950, 'waves', 1),
  ('4d3cd72a-6f70-4e9f-9ce8-c102d51f9034', 'daily_life', 'Arena Mall', 'Major shopping center with supermarkets, cinema, and stores.', 32.1625, 34.8125, 'shopping-bag', 2),
  ('4d3cd72a-6f70-4e9f-9ce8-c102d51f9034', 'mobility', 'Herzliya Train Station', 'Connects to Tel Aviv center in 15 minutes.', 32.1550, 34.8280, 'train', 3);

-- Netanya
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('11a8d815-7dd4-46ab-adc9-d58730f55c61', 'orientation', 'Independence Square', 'The city''s central square with sea views. Main orientation point.', 32.3290, 34.8560, 'building', 1),
  ('11a8d815-7dd4-46ab-adc9-d58730f55c61', 'daily_life', 'Ir Yamim Mall', 'Major shopping destination with supermarket and stores.', 32.3080, 34.8650, 'shopping-bag', 2),
  ('11a8d815-7dd4-46ab-adc9-d58730f55c61', 'mobility', 'Netanya Train Station', 'Central rail connection to Tel Aviv and Haifa.', 32.3270, 34.8620, 'train', 3);

-- Modi'in
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('fa106edb-d938-4367-8543-5fee410f3898', 'orientation', 'Anava Park', 'Large central park with lake. The green heart of Modi''in.', 31.8990, 35.0050, 'trees', 1),
  ('fa106edb-d938-4367-8543-5fee410f3898', 'daily_life', 'Azrieli Mall Modi''in', 'The city''s main shopping center and social hub.', 31.9050, 35.0100, 'shopping-bag', 2),
  ('fa106edb-d938-4367-8543-5fee410f3898', 'mobility', 'Modi''in Central Station', 'Major transit hub with trains to Tel Aviv (25 min) and Jerusalem (30 min).', 31.9080, 34.9990, 'train', 3);

-- Beit Shemesh
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('f9657448-93ce-4aaa-933b-bb80afcdf1b7', 'orientation', 'Beit Shemesh Industrial Park', 'Major employment zone and city reference point.', 31.7480, 34.9920, 'building', 1),
  ('f9657448-93ce-4aaa-933b-bb80afcdf1b7', 'daily_life', 'Big Fashion Mall', 'Main shopping center serving the greater Beit Shemesh area.', 31.7510, 34.9870, 'shopping-bag', 2),
  ('f9657448-93ce-4aaa-933b-bb80afcdf1b7', 'mobility', 'Beit Shemesh Train Station', 'Rail connection to Jerusalem (20 min) and Tel Aviv (45 min).', 31.7430, 34.9880, 'train', 3);

-- Petah Tikva
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('fa0ff028-9532-406b-a4cc-7ae6d3d31622', 'orientation', 'Beilinson Hospital', 'Major medical center and city landmark.', 32.0940, 34.8410, 'heart', 1),
  ('fa0ff028-9532-406b-a4cc-7ae6d3d31622', 'daily_life', 'Ofer Grand Canyon', 'Large shopping mall with diverse retail and dining.', 32.0850, 34.8670, 'shopping-bag', 2),
  ('fa0ff028-9532-406b-a4cc-7ae6d3d31622', 'mobility', 'Petah Tikva Sgula Station', 'Rail connection to central Israel.', 32.0920, 34.8850, 'train', 3);

-- Ramat Gan
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('dc3eda2b-3226-4a76-9274-ebf80d6fcfd8', 'orientation', 'Diamond Exchange', 'World''s largest diamond trading center. Iconic Ramat Gan landmark.', 32.0820, 34.8040, 'building', 1),
  ('dc3eda2b-3226-4a76-9274-ebf80d6fcfd8', 'daily_life', 'Ramat Gan Safari', 'Popular zoo and park. Family-friendly landmark.', 32.0680, 34.8160, 'trees', 2),
  ('dc3eda2b-3226-4a76-9274-ebf80d6fcfd8', 'mobility', 'Ayalon Highway Access', 'Major highway corridor connecting to Tel Aviv and beyond.', 32.0840, 34.8120, 'car', 3);

-- Givat Shmuel
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('5f69d653-6de9-4300-be9e-b26b338e117b', 'orientation', 'Bar-Ilan University', 'Major university campus bordering the city. Key reference point.', 32.0690, 34.8430, 'graduation-cap', 1),
  ('5f69d653-6de9-4300-be9e-b26b338e117b', 'daily_life', 'Givat Shmuel Center', 'Main commercial area with shops and services.', 32.0750, 34.8550, 'shopping-bag', 2),
  ('5f69d653-6de9-4300-be9e-b26b338e117b', 'mobility', 'Route 4 Junction', 'Access to major highway for commuting to Tel Aviv.', 32.0720, 34.8480, 'car', 3);

-- Kfar Saba
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('b2199d81-7b99-4abf-9010-b25adb8a5915', 'orientation', 'Kfar Saba City Park', 'Large urban park at the city''s heart.', 32.1760, 34.9130, 'trees', 1),
  ('b2199d81-7b99-4abf-9010-b25adb8a5915', 'daily_life', 'Weizmann Street', 'Main commercial strip with shops and cafes.', 32.1780, 34.9080, 'shopping-bag', 2),
  ('b2199d81-7b99-4abf-9010-b25adb8a5915', 'mobility', 'Route 531 Access', 'Fast highway connection to Tel Aviv and central Israel.', 32.1700, 34.8950, 'car', 3);

-- Hod HaSharon
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('dee64601-5bac-44fc-ae10-1f4763b05829', 'orientation', 'Yarkon Park North', 'Riverside recreation area and nature reserve.', 32.1550, 34.8850, 'trees', 1),
  ('dee64601-5bac-44fc-ae10-1f4763b05829', 'daily_life', 'Magdiel Commercial Area', 'Main shopping area with supermarkets and services.', 32.1520, 34.8920, 'shopping-bag', 2),
  ('dee64601-5bac-44fc-ae10-1f4763b05829', 'mobility', 'Hod HaSharon - Sokolov Station', 'Train station with direct service to Tel Aviv.', 32.1480, 34.9050, 'train', 3);

-- Ashdod
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('72df4e99-6dcb-41a2-90b2-e0ce44932bfd', 'orientation', 'Ashdod Marina', 'New waterfront development and leisure hub.', 31.8090, 34.6410, 'waves', 1),
  ('72df4e99-6dcb-41a2-90b2-e0ce44932bfd', 'daily_life', 'City Mall Ashdod', 'Major shopping center in the city center.', 31.8020, 34.6510, 'shopping-bag', 2),
  ('72df4e99-6dcb-41a2-90b2-e0ce44932bfd', 'mobility', 'Ashdod Ad Halom Station', 'Rail connection to Tel Aviv (35 min) and Beer Sheva.', 31.7850, 34.6580, 'train', 3);

-- Ashkelon
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('fb505eb3-5b20-4b1c-8e40-82343f39578b', 'orientation', 'National Park Ashkelon', 'Archaeological park on the Mediterranean coast.', 31.6670, 34.5410, 'trees', 1),
  ('fb505eb3-5b20-4b1c-8e40-82343f39578b', 'daily_life', 'Hutzot Mall', 'Main shopping destination with supermarket and retail.', 31.6720, 34.5710, 'shopping-bag', 2),
  ('fb505eb3-5b20-4b1c-8e40-82343f39578b', 'mobility', 'Ashkelon Train Station', 'Rail service to Tel Aviv (50 min) and Beer Sheva.', 31.6640, 34.5690, 'train', 3);

-- Beer Sheva
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('8a7aa261-2675-448d-aace-a7966acb68f8', 'orientation', 'Ben-Gurion University', 'Major university campus. Academic and cultural hub of the Negev.', 31.2620, 34.8020, 'graduation-cap', 1),
  ('8a7aa261-2675-448d-aace-a7966acb68f8', 'daily_life', 'BIG Beer Sheva', 'Large shopping center with diverse retail and entertainment.', 31.2510, 34.7890, 'shopping-bag', 2),
  ('8a7aa261-2675-448d-aace-a7966acb68f8', 'mobility', 'Beer Sheva Central Station', 'Main rail hub for southern Israel.', 31.2430, 34.7980, 'train', 3);

-- Eilat
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('46cc70af-4dae-4c0b-8a58-7f02c1f2fb27', 'orientation', 'Eilat Promenade', 'Beachfront walkway and tourist hub. The heart of Eilat.', 29.5570, 34.9540, 'waves', 1),
  ('46cc70af-4dae-4c0b-8a58-7f02c1f2fb27', 'daily_life', 'Ice Mall Eilat', 'Shopping center with ice rink, stores, and entertainment.', 29.5520, 34.9480, 'shopping-bag', 2),
  ('46cc70af-4dae-4c0b-8a58-7f02c1f2fb27', 'mobility', 'Ramon Airport', 'International airport serving Eilat (20 min drive).', 29.7240, 35.0110, 'plane', 3);

-- Hadera
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('137285b4-38c0-4194-aab5-33fa66ea7ea4', 'orientation', 'Rothschild Park', 'Historic park in the old city center.', 32.4380, 34.9180, 'trees', 1),
  ('137285b4-38c0-4194-aab5-33fa66ea7ea4', 'daily_life', 'Ofer Grand Hadera', 'Major mall with retail, cinema, and dining.', 32.4510, 34.9250, 'shopping-bag', 2),
  ('137285b4-38c0-4194-aab5-33fa66ea7ea4', 'mobility', 'Hadera West Station', 'Fast rail to Tel Aviv (30 min) and Haifa (30 min).', 32.4420, 34.9050, 'train', 3);

-- Zichron Yaakov
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('86c86156-f2c7-48d2-922a-ad32138d7e0a', 'orientation', 'Wine Trail', 'Historic pedestrian street with boutiques and cafes.', 32.5710, 34.9530, 'coffee', 1),
  ('86c86156-f2c7-48d2-922a-ad32138d7e0a', 'daily_life', 'Ramat Hanadiv Gardens', 'Memorial gardens with nature reserve.', 32.5550, 34.9440, 'trees', 2),
  ('86c86156-f2c7-48d2-922a-ad32138d7e0a', 'mobility', 'Binyamina Station', 'Nearby train station (10 min drive) to Tel Aviv.', 32.5180, 34.9370, 'train', 3);

-- Caesarea
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('fb0f9557-6e7e-4565-91a6-1650197390b3', 'orientation', 'Caesarea National Park', 'Ancient Roman harbor and amphitheater. Major landmark.', 32.5000, 34.8920, 'building', 1),
  ('fb0f9557-6e7e-4565-91a6-1650197390b3', 'daily_life', 'Caesarea Golf Club', 'Israel''s only 18-hole golf course and country club.', 32.4930, 34.9050, 'trees', 2),
  ('fb0f9557-6e7e-4565-91a6-1650197390b3', 'mobility', 'Route 2 Access', 'Coastal highway connecting to Tel Aviv (45 min) and Haifa (25 min).', 32.4950, 34.9100, 'car', 3);

-- Pardes Hanna-Karkur
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('3c1c56cd-85d1-42c4-ba1d-b50818025ada', 'orientation', 'Karkur Junction', 'Central crossroads and commercial area.', 32.4720, 34.9850, 'building', 1),
  ('3c1c56cd-85d1-42c4-ba1d-b50818025ada', 'daily_life', 'HaMoshava Street', 'Main street with local shops and services.', 32.4760, 34.9780, 'shopping-bag', 2),
  ('3c1c56cd-85d1-42c4-ba1d-b50818025ada', 'mobility', 'Hadera West Station', 'Nearby train station (10 min) to Tel Aviv.', 32.4420, 34.9050, 'train', 3);

-- Efrat
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('f1c411bd-feb6-4eec-9de9-793a72a022b5', 'orientation', 'Dekel Center', 'Main commercial and community center of Efrat.', 31.6530, 35.1280, 'building', 1),
  ('f1c411bd-feb6-4eec-9de9-793a72a022b5', 'daily_life', 'Supersol Shopping Area', 'Shopping center with supermarket and services.', 31.6500, 35.1260, 'shopping-bag', 2),
  ('f1c411bd-feb6-4eec-9de9-793a72a022b5', 'mobility', 'Route 60 Access', 'Main highway to Jerusalem (25 min) and Hebron.', 31.6480, 35.1320, 'car', 3);

-- Gush Etzion
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('89e43a17-a35d-46ac-bf1f-796d6dde1790', 'orientation', 'Gush Etzion Junction', 'Central intersection and transit point for the region.', 31.6550, 35.1180, 'building', 1),
  ('89e43a17-a35d-46ac-bf1f-796d6dde1790', 'daily_life', 'Gush Etzion Commercial Center', 'Regional shopping area with stores and services.', 31.6520, 35.1150, 'shopping-bag', 2),
  ('89e43a17-a35d-46ac-bf1f-796d6dde1790', 'mobility', 'Route 60 Access', 'Main highway connecting to Jerusalem.', 31.6570, 35.1200, 'car', 3);

-- Ma'ale Adumim
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('a729f666-3728-407c-b40d-b66f73d4b98d', 'orientation', 'Mitzpe Nevo Viewpoint', 'Scenic overlook with views of the Judean Desert.', 31.7650, 35.2920, 'trees', 1),
  ('a729f666-3728-407c-b40d-b66f73d4b98d', 'daily_life', 'Canyon Mall', 'Main shopping center for the city.', 31.7680, 35.3050, 'shopping-bag', 2),
  ('a729f666-3728-407c-b40d-b66f73d4b98d', 'mobility', 'Route 1 Access', 'Highway to Jerusalem (15 min) and the Dead Sea.', 31.7700, 35.3100, 'car', 3);

-- Mevaseret Zion
INSERT INTO public.city_anchors (city_id, anchor_type, name, description, latitude, longitude, icon, display_order)
VALUES 
  ('dc49cf19-9754-487d-a5f7-a8f7ec72dcdd', 'orientation', 'Castel National Park', 'Historic hilltop site with panoramic views.', 31.8050, 35.1420, 'trees', 1),
  ('dc49cf19-9754-487d-a5f7-a8f7ec72dcdd', 'daily_life', 'Mevaseret Town Center', 'Main commercial area with shops and restaurants.', 31.8020, 35.1480, 'shopping-bag', 2),
  ('dc49cf19-9754-487d-a5f7-a8f7ec72dcdd', 'mobility', 'Route 1 Access', 'Direct highway to Jerusalem (10 min) and Tel Aviv (40 min).', 31.8000, 35.1500, 'car', 3);