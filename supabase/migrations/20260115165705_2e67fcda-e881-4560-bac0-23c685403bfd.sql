-- Drop the duplicate 5-room rental columns (keeping the properly named ones)
ALTER TABLE cities DROP COLUMN IF EXISTS rental_5room_min;
ALTER TABLE cities DROP COLUMN IF EXISTS rental_5room_max;