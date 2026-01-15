
-- Add 5-room rental columns to cities table
ALTER TABLE cities 
ADD COLUMN rental_5room_min INTEGER,
ADD COLUMN rental_5room_max INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN cities.rental_5room_min IS 'Minimum 5-room apartment monthly rental in ILS';
COMMENT ON COLUMN cities.rental_5room_max IS 'Maximum 5-room apartment monthly rental in ILS';
