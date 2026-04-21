
-- Update project images with realistic architectural renderings
-- Base URL for all renders
-- Assign images based on city geography and project type

-- Coastal cities - Heights (tower images)
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/coastal-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/hilltop-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/penthouse-tower.jpg'
] WHERE name LIKE '%Heights' AND city IN ('Ashdod', 'Ashkelon', 'Netanya', 'Herzliya', 'Haifa', 'Tel Aviv') AND is_published = true;

-- Coastal cities - Residence (midrise/complex)
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/complex-pool.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/boutique-modern.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/beachfront.jpg'
] WHERE name LIKE '%Residence' AND city IN ('Ashdod', 'Ashkelon', 'Netanya', 'Herzliya', 'Haifa', 'Tel Aviv') AND is_published = true;

-- Coastal cities - Park View
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/beachfront.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/eco-green.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/complex-pool.jpg'
] WHERE name LIKE 'Park View%' AND city IN ('Ashdod', 'Ashkelon', 'Netanya', 'Herzliya', 'Haifa', 'Tel Aviv') AND is_published = true;

-- Coastal cities - Gardens
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/midrise-stone.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/family-neighborhood.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/eco-green.jpg'
] WHERE name LIKE 'The Gardens%' AND city IN ('Ashdod', 'Ashkelon', 'Netanya', 'Herzliya', 'Haifa', 'Tel Aviv') AND is_published = true;

-- Jerusalem area - Heights (stone + tower)
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/jerusalem-stone.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/penthouse-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/hilltop-tower.jpg'
] WHERE name LIKE '%Heights' AND city IN ('Jerusalem', 'Beit Shemesh', 'Mevaseret Zion', 'Efrat') AND is_published = true;

-- Jerusalem area - Residence
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/midrise-stone.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/jerusalem-stone.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/family-neighborhood.jpg'
] WHERE name LIKE '%Residence' AND city IN ('Jerusalem', 'Beit Shemesh', 'Mevaseret Zion', 'Efrat') AND is_published = true;

-- Jerusalem area - Park View
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/family-neighborhood.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/midrise-stone.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/jerusalem-stone.jpg'
] WHERE name LIKE 'Park View%' AND city IN ('Jerusalem', 'Beit Shemesh', 'Mevaseret Zion', 'Efrat') AND is_published = true;

-- Jerusalem area - Gardens
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/eco-green.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/jerusalem-stone.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/midrise-stone.jpg'
] WHERE name LIKE 'The Gardens%' AND city IN ('Jerusalem', 'Beit Shemesh', 'Mevaseret Zion', 'Efrat') AND is_published = true;

-- Central/suburban - Heights (Modiin, Kfar Saba, Hod HaSharon, Ra'anana, Petah Tikva, Ramat Gan)
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/urban-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/hilltop-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/penthouse-tower.jpg'
] WHERE name LIKE '%Heights' AND city IN ('Modiin', 'Kfar Saba', 'Hod HaSharon', 'Ra''anana', 'Petah Tikva', 'Ramat Gan', 'Pardes Hanna') AND is_published = true;

-- Central/suburban - Residence
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/boutique-modern.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/complex-pool.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/eco-green.jpg'
] WHERE name LIKE '%Residence' AND city IN ('Modiin', 'Kfar Saba', 'Hod HaSharon', 'Ra''anana', 'Petah Tikva', 'Ramat Gan', 'Pardes Hanna') AND is_published = true;

-- Central/suburban - Park View
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/eco-green.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/family-neighborhood.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/boutique-modern.jpg'
] WHERE name LIKE 'Park View%' AND city IN ('Modiin', 'Kfar Saba', 'Hod HaSharon', 'Ra''anana', 'Petah Tikva', 'Ramat Gan', 'Pardes Hanna') AND is_published = true;

-- Central/suburban - Gardens
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/family-neighborhood.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/midrise-stone.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/complex-pool.jpg'
] WHERE name LIKE 'The Gardens%' AND city IN ('Modiin', 'Kfar Saba', 'Hod HaSharon', 'Ra''anana', 'Petah Tikva', 'Ramat Gan', 'Pardes Hanna') AND is_published = true;

-- Desert/south - Heights (Beer Sheva, Eilat)
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/desert-villas.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/urban-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/penthouse-tower.jpg'
] WHERE name LIKE '%Heights' AND city IN ('Beer Sheva', 'Eilat') AND is_published = true;

-- Desert/south - Residence
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/beachfront.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/desert-villas.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/complex-pool.jpg'
] WHERE name LIKE '%Residence' AND city IN ('Beer Sheva', 'Eilat') AND is_published = true;

-- Desert/south - Park View
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/complex-pool.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/desert-villas.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/beachfront.jpg'
] WHERE name LIKE 'Park View%' AND city IN ('Beer Sheva', 'Eilat') AND is_published = true;

-- Desert/south - Gardens
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/eco-green.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/desert-villas.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/family-neighborhood.jpg'
] WHERE name LIKE 'The Gardens%' AND city IN ('Beer Sheva', 'Eilat') AND is_published = true;

-- Caesarea (luxury)
UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/penthouse-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/coastal-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/desert-villas.jpg'
] WHERE name LIKE '%Heights' AND city = 'Caesarea' AND is_published = true;

UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/desert-villas.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/penthouse-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/hilltop-tower.jpg'
] WHERE name LIKE '%Residence' AND city = 'Caesarea' AND is_published = true;

UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/coastal-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/penthouse-tower.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/eco-green.jpg'
] WHERE name LIKE 'Park View%' AND city = 'Caesarea' AND is_published = true;

UPDATE projects SET images = ARRAY[
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/midrise-stone.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/desert-villas.jpg',
  'https://eveqhyqxdibjayliazxm.supabase.co/storage/v1/object/public/project-images/renders/penthouse-tower.jpg'
] WHERE name LIKE 'The Gardens%' AND city = 'Caesarea' AND is_published = true;
