-- Update 3-Room Apartment floor plans with architectural layout image
UPDATE project_units 
SET floor_plan_url = 'https://images.unsplash.com/photo-1580063558167-de2c710f1a8d?w=1200&q=80'
WHERE unit_type = '3-Room Apartment' AND floor_plan_url IS NOT NULL;

-- Update 4-Room Apartment floor plans with family layout image
UPDATE project_units 
SET floor_plan_url = 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=1200&q=80'
WHERE unit_type = '4-Room Apartment' AND floor_plan_url IS NOT NULL;

-- Update 5-Room Apartment floor plans with larger family layout image
UPDATE project_units 
SET floor_plan_url = 'https://images.unsplash.com/photo-1628592102751-ba83b0314276?w=1200&q=80'
WHERE unit_type = '5-Room Apartment' AND floor_plan_url IS NOT NULL;

-- Update Penthouse floor plans with luxury layout image
UPDATE project_units 
SET floor_plan_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'
WHERE unit_type = 'Penthouse' AND floor_plan_url IS NOT NULL;