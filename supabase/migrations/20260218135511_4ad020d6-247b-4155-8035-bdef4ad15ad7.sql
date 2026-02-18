
-- Make price and limit columns nullable to support Enterprise "custom" pricing
ALTER TABLE public.membership_plans
  ALTER COLUMN price_monthly_ils DROP NOT NULL,
  ALTER COLUMN price_annual_ils DROP NOT NULL,
  ALTER COLUMN max_seats DROP NOT NULL,
  ALTER COLUMN max_blogs_per_month DROP NOT NULL;
