-- Add additional_rooms to properties table
ALTER TABLE properties ADD COLUMN additional_rooms integer DEFAULT 0;

-- Add additional_rooms to project_units table  
ALTER TABLE project_units ADD COLUMN additional_rooms integer DEFAULT 0;

-- Update existing properties with randomized additional_rooms
UPDATE properties 
SET additional_rooms = CASE 
  WHEN property_type IN ('penthouse', 'house') THEN floor(random() * 2 + 1)::int
  ELSE floor(random() * 2 + 1)::int
END
WHERE additional_rooms = 0 OR additional_rooms IS NULL;

-- Update existing project_units
UPDATE project_units 
SET additional_rooms = CASE 
  WHEN unit_type ILIKE '%penthouse%' THEN 2
  ELSE 1
END
WHERE additional_rooms = 0 OR additional_rooms IS NULL;