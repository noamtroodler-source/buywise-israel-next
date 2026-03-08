
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_founding_partner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payplus_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS payplus_subscription_id TEXT;

ALTER TABLE public.featured_listings
  ADD COLUMN IF NOT EXISTS payplus_subscription_id TEXT;
