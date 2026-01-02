-- Add construction progress field to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS construction_progress_percent integer DEFAULT 0;

-- Add mock project units data for existing projects
-- First, let's get the project IDs and add realistic unit data

-- Insert unit data for sample projects (we'll use a DO block to handle dynamic project IDs)
DO $$
DECLARE
    p_id uuid;
    p_name text;
BEGIN
    -- Loop through all projects and add unit types
    FOR p_id, p_name IN SELECT id, name FROM public.projects
    LOOP
        -- Add 3-room units
        INSERT INTO public.project_units (project_id, unit_type, bedrooms, bathrooms, size_sqm, floor, price, currency, status)
        VALUES 
            (p_id, '3-Room Apartment', 2, 1, 75, 2, 1850000, 'ILS', 'available'),
            (p_id, '3-Room Apartment', 2, 1, 78, 4, 1920000, 'ILS', 'available'),
            (p_id, '3-Room Apartment', 2, 1, 80, 6, 1980000, 'ILS', 'reserved');
            
        -- Add 4-room units
        INSERT INTO public.project_units (project_id, unit_type, bedrooms, bathrooms, size_sqm, floor, price, currency, status)
        VALUES 
            (p_id, '4-Room Apartment', 3, 2, 95, 3, 2450000, 'ILS', 'available'),
            (p_id, '4-Room Apartment', 3, 2, 100, 5, 2550000, 'ILS', 'available'),
            (p_id, '4-Room Apartment', 3, 2, 98, 7, 2650000, 'ILS', 'sold');
            
        -- Add 5-room units
        INSERT INTO public.project_units (project_id, unit_type, bedrooms, bathrooms, size_sqm, floor, price, currency, status)
        VALUES 
            (p_id, '5-Room Apartment', 4, 2, 120, 4, 3200000, 'ILS', 'available'),
            (p_id, '5-Room Apartment', 4, 2, 125, 8, 3450000, 'ILS', 'available');
            
        -- Add penthouse units
        INSERT INTO public.project_units (project_id, unit_type, bedrooms, bathrooms, size_sqm, floor, price, currency, status)
        VALUES 
            (p_id, 'Penthouse', 5, 3, 180, 12, 5500000, 'ILS', 'available'),
            (p_id, 'Penthouse', 4, 2, 150, 10, 4800000, 'ILS', 'reserved');
    END LOOP;
END $$;

-- Update projects with construction progress based on their status
UPDATE public.projects SET construction_progress_percent = 
    CASE 
        WHEN status = 'planning' THEN 5
        WHEN status = 'pre_sale' THEN 15
        WHEN status = 'under_construction' THEN 55
        WHEN status = 'completed' THEN 100
        ELSE 0
    END;