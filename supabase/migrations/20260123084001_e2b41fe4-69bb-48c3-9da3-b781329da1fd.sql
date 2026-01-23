-- Fix 2: Add missing property_type enum values
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'garden_apartment';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'mini_penthouse';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'duplex';