-- Add display_order column to project_units table
ALTER TABLE project_units 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing records to have sequential order based on creation date
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) - 1 as new_order
  FROM project_units
)
UPDATE project_units 
SET display_order = ordered.new_order
FROM ordered 
WHERE project_units.id = ordered.id;