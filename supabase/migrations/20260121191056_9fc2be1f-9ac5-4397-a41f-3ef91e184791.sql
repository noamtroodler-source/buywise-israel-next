-- Add mortgage_preferences JSONB column to buyer_profiles
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS 
  mortgage_preferences jsonb DEFAULT '{"down_payment_percent": null, "down_payment_amount": null, "term_years": 25, "assumed_rate": 5.25}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.buyer_profiles.mortgage_preferences IS 'User mortgage assumptions: down_payment_percent, down_payment_amount, term_years, assumed_rate';