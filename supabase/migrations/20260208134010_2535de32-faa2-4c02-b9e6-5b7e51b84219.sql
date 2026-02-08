-- Add onboarding_step column to track wizard progress
ALTER TABLE public.buyer_profiles 
ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT NULL;

COMMENT ON COLUMN public.buyer_profiles.onboarding_step IS 
  'Tracks wizard progress: null=not started, 1-7=current step, complete=finished';