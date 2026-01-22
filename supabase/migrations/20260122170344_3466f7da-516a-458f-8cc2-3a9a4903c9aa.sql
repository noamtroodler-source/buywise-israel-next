-- Add structured lease reality fields to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS lease_term TEXT CHECK (lease_term IN ('6_months', '12_months', '24_months', 'flexible', 'other')),
ADD COLUMN IF NOT EXISTS subletting_allowed TEXT CHECK (subletting_allowed IN ('allowed', 'case_by_case', 'not_allowed')),
ADD COLUMN IF NOT EXISTS furnished_status TEXT CHECK (furnished_status IN ('fully', 'semi', 'unfurnished')),
ADD COLUMN IF NOT EXISTS pets_policy TEXT CHECK (pets_policy IN ('allowed', 'case_by_case', 'not_allowed'));

-- Migrate existing data from is_furnished boolean to furnished_status
UPDATE public.properties 
SET furnished_status = CASE 
  WHEN is_furnished = true THEN 'fully'
  WHEN is_furnished = false THEN 'unfurnished'
  ELSE NULL 
END
WHERE furnished_status IS NULL AND is_furnished IS NOT NULL;

-- Migrate existing allows_pets data to pets_policy
UPDATE public.properties 
SET pets_policy = CASE 
  WHEN allows_pets = 'all' THEN 'allowed'
  WHEN allows_pets IN ('cats', 'dogs') THEN 'case_by_case'
  WHEN allows_pets = 'none' THEN 'not_allowed'
  ELSE NULL 
END
WHERE pets_policy IS NULL AND allows_pets IS NOT NULL;