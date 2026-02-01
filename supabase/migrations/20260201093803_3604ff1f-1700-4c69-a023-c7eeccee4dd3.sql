-- Feature 1: Property Questions table
CREATE TABLE public.property_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  category TEXT NOT NULL, -- 'pricing', 'building', 'legal', 'rental', 'construction', 'missing_info'
  applies_to JSONB DEFAULT '{}', -- {"listing_status": ["for_sale"], "property_type": ["apartment"], "conditions": {"year_built_before": 1980}}
  priority INTEGER DEFAULT 50 CHECK (priority >= 1 AND priority <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_questions ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view active questions)
CREATE POLICY "Anyone can read active questions" 
ON public.property_questions 
FOR SELECT 
USING (is_active = true);

-- Feature 3: Add readiness_snapshot column to buyer_profiles
ALTER TABLE public.buyer_profiles 
ADD COLUMN IF NOT EXISTS readiness_snapshot JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.buyer_profiles.readiness_snapshot IS 'JSON containing user readiness check results: stage, confidence_checks, gaps_identified, completed_at';