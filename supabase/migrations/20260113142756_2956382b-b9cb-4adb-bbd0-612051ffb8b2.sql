-- Add pets allowed column to properties
ALTER TABLE properties 
ADD COLUMN allows_pets text 
CHECK (allows_pets IN ('none', 'cats', 'dogs', 'all'));