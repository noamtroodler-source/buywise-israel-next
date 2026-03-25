
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_source text;
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS city_of_residence text;
ALTER TABLE public.buyer_profiles ADD COLUMN IF NOT EXISTS referral_source text;
