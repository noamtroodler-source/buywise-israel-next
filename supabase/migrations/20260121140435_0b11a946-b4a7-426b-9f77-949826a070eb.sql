-- Populate floor_plan_url for existing project_units with mock floor plan images
-- Using architectural floor plan style images from Unsplash

-- 3-Room Apartments - most get a floor plan, some don't
UPDATE project_units 
SET floor_plan_url = 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80'
WHERE unit_type ILIKE '%3-Room%' OR unit_type ILIKE '%3 Room%' OR unit_type ILIKE '%three%room%';

-- 4-Room Apartments
UPDATE project_units 
SET floor_plan_url = 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80'
WHERE unit_type ILIKE '%4-Room%' OR unit_type ILIKE '%4 Room%' OR unit_type ILIKE '%four%room%';

-- 5-Room Apartments - leave some NULL to show "Coming Soon" state
UPDATE project_units 
SET floor_plan_url = CASE 
  WHEN random() > 0.3 THEN 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
  ELSE NULL
END
WHERE unit_type ILIKE '%5-Room%' OR unit_type ILIKE '%5 Room%' OR unit_type ILIKE '%five%room%';

-- Penthouses
UPDATE project_units 
SET floor_plan_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'
WHERE unit_type ILIKE '%penthouse%';

-- Garden Apartments
UPDATE project_units 
SET floor_plan_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
WHERE unit_type ILIKE '%garden%';

-- Studio units - leave NULL to demonstrate "Coming Soon"
UPDATE project_units 
SET floor_plan_url = NULL
WHERE unit_type ILIKE '%studio%';

-- Mini Penthouse
UPDATE project_units 
SET floor_plan_url = 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80'
WHERE unit_type ILIKE '%mini%penthouse%';